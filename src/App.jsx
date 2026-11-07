import { useEffect, useState } from "react";

const USER = "maxkunc";
const TIMEZONE = "Europe/Prague";
const TILE_COLORS = ["blue", "mint", "salmon", "black", "purple", "yellow"];

// Shown immediately and kept if the GitHub API is unreachable or rate-limited.
const FALLBACK = ["apalucha", "psjgtools", "vinotekaumazlika", "zitnyeu"].map((name) => ({
  name,
  description: "",
  url: `https://${USER}.github.io/${name}/`,
  pushedAt: null,
}));

// Picks a 3D emoji for a repo: by keyword first, otherwise a stable pick from the name.
const KEYWORDS = [
  [/vino|wine/, "wine"],
  [/zit|rye|bread|pek/, "rye"],
  [/map|mapa/, "map"],
  [/school|skol|psjg|edu/, "school"],
  [/tool/, "tools"],
  [/bot|ai/, "robot"],
];
const POOL = ["globe", "sparkles", "puzzle", "palette", "bulb", "package", "alien", "laptop", "phone"];

function emojiFor(name) {
  const n = name.toLowerCase();
  for (const [re, e] of KEYWORDS) if (re.test(n)) return e;
  let h = 0;
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return POOL[h % POOL.length];
}

function toProject(repo) {
  const url = /^https?:\/\//.test(repo.homepage || "")
    ? repo.homepage
    : `https://${USER}.github.io/${repo.name}/`;
  return { name: repo.name, description: repo.description || "", url, pushedAt: repo.pushed_at };
}

function useGitHub() {
  const [state, setState] = useState({ projects: FALLBACK, publicRepos: null });

  useEffect(() => {
    const ctrl = new AbortController();
    const get = (path) =>
      fetch(`https://api.github.com/${path}`, { signal: ctrl.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(r.status)
      );

    get(`users/${USER}/repos?per_page=100&sort=updated`)
      .then((repos) => {
        const pages = repos
          .filter((r) => r.has_pages && !r.archived && r.name.toLowerCase() !== `${USER}.github.io`)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(toProject);
        if (pages.length) setState((s) => ({ ...s, projects: pages }));
        setState((s) => ({ ...s, publicRepos: repos.length }));
      })
      .catch(() => {});

    return () => ctrl.abort();
  }, []);

  return state;
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function timeParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "00";
  return [get("hour"), get("minute"), get("second")];
}

function yearProgress(date) {
  const y = date.getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date(y + 1, 0, 1);
  return Math.floor(((date - start) / (end - start)) * 100);
}

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

const fmtLongDate = (d) =>
  d.toLocaleDateString("en-GB", { timeZone: TIMEZONE, weekday: "long", day: "numeric", month: "long" });

const Emoji = ({ name, className }) => (
  <img className={className} src={`/emoji/${name}.webp`} alt="" draggable="false" />
);

function Nav() {
  return (
    <header className="nav">
      <a className="logo" href="/">
        <span className="logo-mark" aria-hidden="true">
          <span />
        </span>
        {USER}
      </a>
      <nav className="nav-links">
        <a href="#sites">Sites</a>
        <a href={`https://github.com/${USER}?tab=repositories`}>Repos</a>
        <a href={`https://github.com/${USER}`}>Profile</a>
      </nav>
      <a className="btn btn-dark btn-sm" href={`https://github.com/${USER}`}>
        Follow on GitHub
      </a>
    </header>
  );
}

function Hero({ count, latest }) {
  return (
    <section className="card yellow hero">
      <div className="row-between">
        <span className="chip dark">
          <i className="dot" /> {count} sites live now
        </span>
        <span className="label">{USER}.github.io</span>
      </div>
      <h1 className="headline">
        Hi, I'm
        <br />
        {USER}.
        <br />
        <span className="highlight">I ship sites.</span>
      </h1>
      <div className="hero-foot">
        <p>Small web projects, built and deployed straight from GitHub. Pick one below to open it.</p>
        <div className="hero-actions">
          <a className="btn btn-dark" href={`https://github.com/${USER}`}>
            Open GitHub <span className="chev">›</span>
          </a>
          {latest && (
            <a className="btn btn-outline" href={latest.url}>
              Newest site
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function LatestDeploy({ latest }) {
  return (
    <a className="card purple launch" href={latest?.url ?? "#sites"}>
      <div className="row-between">
        <span className="label">Latest deploy</span>
        <span className="chip dark">live</span>
      </div>
      <div className="orbit" aria-hidden="true">
        <span className="sun" />
        <Emoji name="rocket" className="rocket" />
      </div>
      <div className="launch-text">
        <span className="launch-name">{latest?.name}</span>
        {latest?.pushedAt && <span className="launch-date">{fmtDate(latest.pushedAt)}</span>}
      </div>
    </a>
  );
}

function CodeCard({ projects }) {
  const shown = projects.slice(0, 5);
  return (
    <section className="card black code">
      <div className="row-between">
        <span className="code-file">{USER}/pages.js</span>
        <span className="chip yellow-chip">{projects.length} sites</span>
      </div>
      <pre className="code-body">
        <span className="ln">1</span>
        <span className="kw">import</span> {"{ gh }"} <span className="kw">from</span>{" "}
        <span className="str">"github"</span>
        {"\n"}
        <span className="ln">2</span>
        <span className="kw">const</span> sites = gh.
        <span className="fn">pages</span>(<span className="str">"{USER}"</span>)
        {shown.map((p, i) => (
          <span key={p.name}>
            {"\n"}
            <span className="ln">{i + 3}</span>
            sites.<span className="fn">open</span>(<span className="str">"{p.name}"</span>)
          </span>
        ))}
        {projects.length > shown.length && (
          <>
            {"\n"}
            <span className="ln">{shown.length + 3}</span>
            <span className="cm">// +{projects.length - shown.length} more</span>
          </>
        )}
        {"\n"}
        <span className="ln">{shown.length + (projects.length > shown.length ? 4 : 3)}</span>
        <span className="kw">await</span> sites.<span className="fn">deploy</span>()
      </pre>
      <div className="code-status">
        <i className="dot" /> live at {USER}.github.io
      </div>
    </section>
  );
}

function ClockCard({ publicRepos }) {
  const now = useNow();
  const [h, m, s] = timeParts(now);
  const pct = yearProgress(now);
  return (
    <section className="card salmon clock">
      <span className="label">Local time · Prague</span>
      <div className="clock-digits">
        <div>
          {h}
          <small>hrs</small>
        </div>
        <span className="colon">:</span>
        <div>
          {m}
          <small>min</small>
        </div>
        <span className="colon">:</span>
        <div>
          {s}
          <small>sec</small>
        </div>
      </div>
      <div className="clock-date">{fmtLongDate(now)}</div>
      <div className="bar">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="bar-caption">
        <b>{pct}%</b> of {now.getFullYear()} already shipped
      </p>
      <a className="profile" href={`https://github.com/${USER}`}>
        <img src={`https://github.com/${USER}.png?size=96`} alt="" />
        <span>
          <b>@{USER}</b>
          <small>{publicRepos != null ? `${publicRepos} public repos` : "on GitHub"}</small>
        </span>
      </a>
    </section>
  );
}

function SiteTile({ project, index }) {
  const color = TILE_COLORS[index % TILE_COLORS.length];
  return (
    <a className={`card tile ${color}`} href={project.url} style={{ "--len": project.name.length }}>
      <span className="label">Site {String(index + 1).padStart(2, "0")}</span>
      <Emoji name={emojiFor(project.name)} className="tile-emoji" />
      <div className="tile-text">
        <span className="tile-name">{project.name}</span>
        <span className="tile-open">{project.description || "open site"} ↗</span>
      </div>
    </a>
  );
}

export default function App() {
  const { projects, publicRepos } = useGitHub();
  const latest = [...projects].sort((a, b) => (b.pushedAt || "").localeCompare(a.pushedAt || ""))[0];

  return (
    <div className="page">
      <Nav />
      <main className="bento">
        <Hero count={projects.length} latest={latest} />
        <LatestDeploy latest={latest} />
        <CodeCard projects={projects} />
        <ClockCard publicRepos={publicRepos} />
        <section className="sites" id="sites" aria-label="Sites">
          {projects.map((p, i) => (
            <SiteTile key={p.name} project={p} index={i} />
          ))}
        </section>
      </main>
    </div>
  );
}
