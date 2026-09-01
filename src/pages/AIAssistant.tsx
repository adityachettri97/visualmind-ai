import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Trash2 } from "lucide-react";
import { useDatasetStore } from "../store/datasetStore";
import { useChatStore } from "../store/chatStore";
import { flushChatSync } from "../sync/chatSync";
import { chatWithAI, type ChatMessage } from "../services/aiService";

// Keeps table cells, bold text, and lists readable inside a narrow chat bubble instead of the
// browser/Tailwind defaults (which assume a full-width document, not an 80%-wide bubble).
const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-white">{children}</strong>,
  // GFM task-list items ("- [ ] ...") render as a plain <li> with a checkbox <input> as its
  // first child — react-markdown doesn't expose a "this is a task item" prop, so the :has()
  // selector below targets exactly those <li>s to drop the inherited disc marker, since they
  // already show a checkbox and don't need a bullet next to it too.
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0 [&_li:has(>input[type='checkbox'])]:list-none">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-violet-300 underline hover:text-violet-200">
      {children}
    </a>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs">{children}</code>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-slate-900/60">{children}</thead>,
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-slate-700 px-2 py-1.5 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => <td className="border border-slate-700 px-2 py-1.5 align-top">{children}</td>,
  h1: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 text-base font-bold">{children}</p>,
  h2: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 text-base font-bold">{children}</p>,
  h3: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 text-sm font-bold">{children}</p>,
};

function AssistantMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}

function AIAssistant() {
  const { data, fileName } = useDatasetStore();
  const { messages, addMessages, clearMessages } = useChatStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Grows the textarea with its content, up to the max-h-32 cap set on it below (past that it
  // scrolls internally instead of pushing the rest of the page around).
  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input]);

  const handleSend = async () => {
    const question = input.trim();

    if (!question || loading) return;

    const userMessage: ChatMessage = { role: "user", content: question };

    addMessages([userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const answer = await chatWithAI(data, question, messages);

      addMessages([{ role: "assistant", content: answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong talking to the AI assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 lg:gap-5 min-h-0">
      <div className="glass rounded-2xl p-4 sm:p-5 shrink-0 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">AI Assistant</h2>

          <p className="text-sm text-slate-400">
            {fileName ? `Ask questions about ${fileName}.` : "Upload a dataset, then ask questions about it here."}
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearMessages();
              flushChatSync();
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-red-500 hover:text-red-400"
          >
            <Trash2 size={15} />
            Clear conversation
          </button>
        )}
      </div>

      <div className="glass flex-1 min-h-0 flex flex-col rounded-2xl p-4 sm:p-5">
        <div ref={scrollRef} className="glass-scrollbar flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">No messages yet. Try asking "Which entry has the highest value?"</p>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user" ? "bg-violet-600 text-white" : "bg-slate-800/70 text-slate-200 border border-slate-700"
                }`}
              >
                {message.role === "assistant" ? (
                  <AssistantMessage content={message.content} />
                ) : (
                  <span className="whitespace-pre-wrap">{message.content}</span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl px-4 py-3 text-sm bg-slate-800/70 border border-slate-700 text-slate-400">Thinking...</div>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-400 shrink-0">{error}</p>}

        <div className="mt-4 flex gap-3 shrink-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              // Enter alone sends; Shift+Enter inserts a newline (the browser default for a
              // textarea), which is why only the no-shift case is intercepted here.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your dataset... (Shift+Enter for a new line)"
            rows={1}
            className="max-h-32 flex-1 min-w-0 resize-none rounded-lg bg-[#131C31] px-4 py-3 leading-6 outline-none border border-slate-700 focus:border-violet-500 glass-scrollbar"
          />

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-lg bg-violet-600 px-5 py-3 font-medium hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
