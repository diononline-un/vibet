import pty from "@lydell/node-pty";

const cmd = process.argv[2];
const args = process.argv.slice(3);

const p = pty.spawn(cmd, args, {
  name: "xterm-256color",
  cols: 100,
  rows: 30,
  cwd: "/home/dion/Projekte/vibet",
  env: { ...process.env, TERM: "xterm-256color" },
});

let out = "";
p.onData((d) => {
  out += d;
});

p.onExit(({ exitCode }) => {
  const esc = out.split("\u001b").length - 1;
  console.log(JSON.stringify({ exitCode, bytes: out.length, escSequences: esc, sample: out.slice(0, 400) }));
});

setTimeout(() => p.kill(), 4000);
