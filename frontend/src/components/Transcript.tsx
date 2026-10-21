/** Bolna transcripts are "assistant: …" / "user: …" lines; shown as a quiet chat. */
export function Transcript({ text, agent, person }: { text: string; agent: string; person: string }) {
  const lines = text
    .split('\n')
    .map((l) => l.match(/^\s*(assistant|user)\s*:\s*(.*)$/i))
    .filter((m): m is RegExpMatchArray => !!m && !!m[2].trim())

  return (
    <ol className="transcript">
      {lines.map((m, i) => {
        const fromAgent = m[1].toLowerCase() === 'assistant'
        return (
          <li key={i} className={fromAgent ? 'from-agent' : 'from-person'}>
            <span className="who">{fromAgent ? agent : person}</span>
            <p>{m[2].trim()}</p>
          </li>
        )
      })}
    </ol>
  )
}
