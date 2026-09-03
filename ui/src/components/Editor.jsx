import Editor from "@monaco-editor/react";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/editor/editor.worker?worker";

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

loader.config({ monaco });

export default function MonacoEditor({ content, onChange, path }) {
  const language = (path || "").match(/\.([^.]+)$/)?.[1] || "plaintext";
  const map = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", json: "json", css: "css", html: "html", md: "markdown" };
  return (
    <Editor
      height="100%"
      defaultLanguage={map[language] || "plaintext"}
      value={content}
      onChange={(v) => onChange(v || "")}
      theme="vs-dark"
      options={{ fontSize: 12, minimap: { enabled: false } }}
    />
  );
}
