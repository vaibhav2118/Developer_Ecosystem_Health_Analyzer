import httpx
import logging
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from backend.app.config import settings

logger = logging.getLogger(__name__)

class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.GITHUB_TOKEN
        self.headers = {}
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"
        self.headers["Accept"] = "application/vnd.github.v3+json"
        self.base_url = "https://api.github.com"

    async def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=self.headers, params=params)
            if response.status_code == 403 and "rate limit" in response.text.lower():
                logger.warning("GitHub rate limit reached, falling back to mock generator")
                raise HTTPException(status_code=403, detail="Rate limit exceeded")
            response.raise_for_status()
            return response.json()

    async def fetch_repository_data(self, full_name: str) -> Dict[str, Any]:
        """
        Fetches repository details, commits, issues, PRs, and dependencies.
        Falls back to Mock Data Engine if the network fails, token is missing, or repo does not exist.
        """
        if not self.token:
            logger.info(f"No GitHub token provided. Running in Mock Data mode for {full_name}")
            return self.generate_mock_repository(full_name)

        try:
            # Try fetching real repo data
            parts = full_name.split("/")
            if len(parts) != 2:
                raise ValueError("Repository full_name must be in format 'owner/repo'")
            owner, repo = parts[0], parts[1]
            
            repo_details = await self._get(f"/repos/{owner}/{repo}")
            
            # Fetch contributors
            try:
                contributors = await self._get(f"/repos/{owner}/{repo}/contributors", params={"per_page": 30})
            except Exception:
                contributors = []

            # Fetch commits (past 90 days)
            since_date = (datetime.utcnow() - timedelta(days=90)).isoformat() + "Z"
            try:
                commits = await self._get(f"/repos/{owner}/{repo}/commits", params={"since": since_date, "per_page": 100})
            except Exception:
                commits = []

            # Fetch PRs (past 90 days)
            try:
                prs = await self._get(f"/repos/{owner}/{repo}/pulls", params={"state": "all", "per_page": 50})
            except Exception:
                prs = []

            # Fetch Issues (past 90 days)
            try:
                issues = await self._get(f"/repos/{owner}/{repo}/issues", params={"state": "all", "per_page": 50})
                # Filter out PRs (GitHub issues endpoint returns both issues and PRs)
                issues = [issue for issue in issues if "pull_request" not in issue]
            except Exception:
                issues = []

            # Fetch dependency manifests (check common file paths)
            dependency_files = {}
            manifests = ["package.json", "requirements.txt", "go.mod", "pom.xml"]
            for manifest in manifests:
                try:
                    content_res = await self._get(f"/repos/{owner}/{repo}/contents/{manifest}")
                    if "content" in content_res:
                        import base64
                        decoded_content = base64.b64decode(content_res["content"]).decode("utf-8", errors="ignore")
                        dependency_files[manifest] = decoded_content
                except Exception:
                    continue
            
            # If we didn't find any dependency manifest, create a default one based on language
            primary_lang = repo_details.get("language", "Python")
            if not dependency_files:
                dependency_files = self._get_default_dependency_content(primary_lang)

            return {
                "source": "api",
                "details": repo_details,
                "contributors": contributors,
                "commits": commits,
                "prs": prs,
                "issues": issues,
                "dependency_files": dependency_files
            }

        except Exception as e:
            logger.warning(f"Error fetching real data for {full_name}: {str(e)}. Falling back to Mock Engine.")
            return self.generate_mock_repository(full_name)

    def _get_default_dependency_content(self, language: str) -> Dict[str, str]:
        if language and language.lower() in ["javascript", "typescript"]:
            return {
                "package.json": '{\n  "dependencies": {\n    "lodash": "^4.17.21",\n    "react": "^18.2.0",\n    "express": "^4.18.2",\n    "axios": "^0.27.2"\n  }\n}'
            }
        elif language and language.lower() in ["go"]:
            return {
                "go.mod": "module example.com/app\n\ngo 1.18\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.0\n\tgithub.com/stretchr/testify v1.8.1\n)"
            }
        elif language and language.lower() in ["java"]:
            return {
                "pom.xml": "<project>\n  <dependencies>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-web</artifactId>\n      <version>3.0.2</version>\n    </dependency>\n  </dependencies>\n</project>"
            }
        else:
            # Python default
            return {
                "requirements.txt": "fastapi==0.110.0\nuvicorn==0.28.0\npydantic>=2.6.4\nsqlalchemy>=2.0.28\nrequests==2.28.1\npandas>=2.0.0\n"
            }

    def generate_mock_repository(self, full_name: str) -> Dict[str, Any]:
        """
        Generates realistic history, files, commits, issues, PRs, and contributors.
        Enables high-fidelity demos without an API token or connection.
        """
        random.seed(hash(full_name))
        
        parts = full_name.split("/")
        owner = parts[0] if len(parts) > 0 else "mock-owner"
        name = parts[1] if len(parts) > 1 else "mock-repo"
        
        # Pick a primary language
        languages = ["Python", "JavaScript", "TypeScript", "Go", "Java"]
        language = random.choice(languages)
        
        stars = random.randint(150, 18500)
        forks = int(stars * random.uniform(0.1, 0.35))
        watchers = int(stars * random.uniform(0.05, 0.15))
        open_issues = random.randint(10, 250)
        
        details = {
            "id": random.randint(10000000, 99999999),
            "name": name,
            "full_name": full_name,
            "description": f"An intelligent open-source framework for {name} solutions written in {language}.",
            "html_url": f"https://github.com/{full_name}",
            "stargazers_count": stars,
            "forks_count": forks,
            "subscribers_count": watchers,
            "open_issues_count": open_issues,
            "language": language,
            "created_at": (datetime.utcnow() - timedelta(days=random.randint(365, 1500))).isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }
        
        # Generate contributors (12 contributors, some core, some long tail)
        contributor_usernames = [
            f"dev-{owner.lower()}", f"coder-{name.lower()}", "alovelace", "aturing",
            "gh-master", "stack-overflow-copy-paste", "shadow-coder", "open-source-hero",
            "commit-machine", "cleanup-agent", "bug-hunter", "first-time-committer"
        ]
        
        contributors = []
        for i, username in enumerate(contributor_usernames):
            # core contributor has higher commit shares
            contributions = random.randint(2, 50) if i > 2 else random.randint(100, 500)
            contributors.append({
                "id": random.randint(100000, 999999),
                "login": username,
                "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={username}",
                "html_url": f"https://github.com/{username}",
                "contributions": contributions
            })
            
        # Generate Commits (last 180 days)
        commits = []
        now = datetime.utcnow()
        # High concentration of commits for core developers, low for long tail
        for i in range(250):
            commit_date = now - timedelta(days=random.uniform(0, 180), hours=random.uniform(0, 24))
            author = random.choice(contributors[:3]) if random.random() < 0.7 else random.choice(contributors[3:])
            sha = f"mocksha{random.randint(10000000, 99999999)}abc123"
            
            commit_messages = [
                f"Feature: implement new core module for {name}",
                "Fix: resolve race condition in network thread",
                "Docs: update readme guides and license",
                "Chore: bump dependency versions",
                "Refactor: decouple database queries from controller",
                "Test: add integration tests for auth token generation",
                f"Merge pull request #{random.randint(1, 150)} from dev-branch",
                "Optimization: caching layer response time improvement"
            ]
            
            additions = random.randint(5, 450)
            deletions = int(additions * random.uniform(0.1, 0.8))
            
            commits.append({
                "sha": sha,
                "commit": {
                    "author": {
                        "name": author["login"],
                        "email": f"{author['login']}@example.com",
                        "date": commit_date.isoformat() + "Z"
                    },
                    "message": random.choice(commit_messages)
                },
                "author": {
                    "login": author["login"],
                    "avatar_url": author["avatar_url"],
                    "id": author["id"]
                },
                "stats": {
                    "additions": additions,
                    "deletions": deletions
                }
            })
            
        # Generate Pull Requests (past 90 days)
        prs = []
        for i in range(1, 40):
            created = now - timedelta(days=random.uniform(5, 90))
            is_merged = random.random() < 0.75
            closed_at = None
            merged_at = None
            state = "open"
            
            if is_merged:
                state = "closed"
                closed_at = (created + timedelta(hours=random.uniform(2, 120))).isoformat() + "Z"
                merged_at = closed_at
            elif random.random() < 0.5:
                state = "closed"
                closed_at = (created + timedelta(hours=random.uniform(5, 150))).isoformat() + "Z"
                
            creator = random.choice(contributors)
            
            prs.append({
                "number": i,
                "title": f"PR: {random.choice(['Add error handling', 'Upgrade config schema', 'Optimized sorting', 'CSS enhancements'])}",
                "state": state,
                "user": {"login": creator["login"]},
                "created_at": created.isoformat() + "Z",
                "closed_at": closed_at,
                "merged_at": merged_at,
                "comments": random.randint(0, 15),
                "review_comments": random.randint(0, 8),
            })
            
        # Generate Issues (past 90 days)
        issues = []
        for i in range(41, 90):
            created = now - timedelta(days=random.uniform(2, 90))
            is_closed = random.random() < 0.80
            closed_at = None
            state = "open"
            
            if is_closed:
                state = "closed"
                closed_at = (created + timedelta(hours=random.uniform(1, 180))).isoformat() + "Z"
                
            creator = random.choice(contributors[3:]) # external reports mostly
            
            issues.append({
                "number": i,
                "title": f"Issue: {random.choice(['Memory leak on restart', 'Documentation missing parameter details', 'Docker environment fails on windows', 'Unhandled HTTP exception'])}",
                "state": state,
                "user": {"login": creator["login"]},
                "created_at": created.isoformat() + "Z",
                "closed_at": closed_at,
                "comments": random.randint(0, 10),
            })
            
        # Generate dependency file content
        dependency_files = self._get_default_dependency_content(language)
        
        # Inject staleness/random dependencies in package.json/requirements.txt
        if language == "Python":
            # requirement packages: fastapi, requests, numpy, pandas, tensorflow, urllib3
            # make sure some have older version for staleness evaluation
            dependency_files["requirements.txt"] = (
                "fastapi==0.95.0\n"
                "uvicorn==0.20.0\n"
                "pydantic==1.10.7\n"
                "requests==2.26.0\n"
                "numpy==1.21.0\n"
                "pandas==1.3.0\n"
                "cryptography==3.4.0\n" # known OSV vuln
            )
        elif language in ["JavaScript", "TypeScript"]:
            dependency_files["package.json"] = (
                '{\n  "dependencies": {\n'
                '    "react": "^16.14.0",\n'
                '    "lodash": "^4.17.15",\n'
                '    "express": "^4.16.4",\n'
                '    "axios": "^0.21.0",\n'
                '    "minimist": "1.2.0"\n' # known OSV vuln
                '  }\n}'
            )

        return {
            "source": "mock",
            "details": details,
            "contributors": contributors,
            "commits": commits,
            "prs": prs,
            "issues": issues,
            "dependency_files": dependency_files
        }
