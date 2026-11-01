import { useEffect, useState } from "react";

const USER = "maxkunc";

// Shown immediately and kept if the GitHub API is unreachable or rate-limited.
const FALLBACK = ["apalucha", "psjgtools", "vinotekaumazlika", "zitnyeu"].map((name) => ({
  name,
  description: "",
  url: `https://${USER}.github.io/${name}/`,
}));

function toProject(repo) {
  const url = /^https?:\/\//.test(repo.homepage || "")
    ? repo.homepage
    : `https://${USER}.github.io/${repo.name}/`;
  return { name: repo.name, description: repo.description || "", url };
}

function usePagesRepos() {
  const [projects, setProjects] = useState(FALLBACK);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((repos) => {
        const pages = repos
          .filter((r) => r.has_pages && !r.archived && r.name.toLowerCase() !== `${USER}.github.io`)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(toProject);
        if (pages.length) setProjects(pages);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  return projects;
}

function Prompt({ children }) {
  return (
    <span className="prompt">
      <span className="user">max@github</span>:<span className="dir">~</span>$ {children}
    </span>
  );
}

function ProjectItem({ project, index }) {
  return (
    <li>
      <a href={project.url}>
        <span className="idx">{String(index + 1).padStart(2, "0")}</span>
        <span className="arrow">▸</span>
        <span className="repo-name">{project.name}</span>
        <span className="repo-desc">{project.description && `// ${project.description}`}</span>
        <span className="open">open ↗</span>
      </a>
    </li>
  );
}

export default function App() {
  const projects = usePagesRepos();

  return (
    <main className="window">
      <div className="titlebar">
        <span className="dot r" />
        <span className="dot y" />
        <span className="dot g" />
        <span className="path">~/{USER}.github.io — bash</span>
      </div>
      <div className="content">
        <Prompt>whoami</Prompt>
        <h1>
          <span className="kw">&lt;</span>
          <span className="name">{USER}</span>
          <span className="kw"> /&gt;</span>
          <span className="cursor" />
        </h1>
        <p className="comment">// projects live on GitHub Pages — pick one to open</p>

        <div className="section">
          <Prompt>
            <span className="fn">ls</span> ./pages
          </Prompt>
        </div>
        <ul className="repos">
          {projects.map((p, i) => (
            <ProjectItem key={p.name} project={p} index={i} />
          ))}
        </ul>

        <div className="footer">
          <span className="prompt">$</span> open <a href={`https://github.com/${USER}`}>github.com/{USER}</a>
        </div>
      </div>
    </main>
  );
}
