import { useState } from 'react';

export default function GeminiPanel({ transcript, consultationId }) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('text-bison-001');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const promptWrapper = (patient, transcriptText) => {
    return `You are a conservative clinical assistant. Given the patient metadata and consultation transcript, return ONLY valid JSON that matches this schema:\n{\n  "primary_diagnosis":"string",\n  "differential":[{"diagnosis":"string","confidence":0.0,"evidence":["excerpt"]}],\n  "overall_confidence":0.0,\n  "recommendations":"string",\n  "notes":"string"\n}\nPatient: ${JSON.stringify(patient || {})}\nTranscript: ${transcriptText || ''}\nBe concise and conservative. Output only JSON.`;
  };

  const callGemini = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      // Build the prompt
      const prompt = promptWrapper({}, transcript);

      // NOTE: Replace endpoint below if needed. This example uses Google Generative Language API pattern.
      const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateText?key=${apiKey}`;

      const body = {
        prompt: {
          text: prompt
        },
        temperature: 0.0,
        max_output_tokens: 512
      };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Provider error: ${resp.status} ${t}`);
      }

      const json = await resp.json();
      // Response shapes vary; try to extract text
      const text = json?.candidates?.[0]?.output || json?.output?.[0]?.content || json?.candidates?.[0]?.content || JSON.stringify(json);

      // Try to parse JSON block
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const m = (text || '').match(/\{[\s\S]*\}/m);
        if (m) {
          try { parsed = JSON.parse(m[0]); } catch (ee) { parsed = { raw_text: text }; }
        } else parsed = { raw_text: text };
      }

      setResult({ parsed, raw: text, prompt });
    } catch (err) {
      console.error('Gemini call error', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToServer = async (accepted) => {
    if (!consultationId || !result) return alert('No consultation or result to save');
    try {
      const payload = {
        ai_diagnosis: result.parsed,
        ai_responseText: result.raw,
        ai_prompt: result.prompt,
        ai_model: model,
        ai_accepted: accepted ? true : false
      };
      const res = await fetch(`/api/consultations/${consultationId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Save failed');
      alert('AI suggestion saved');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  return (
    <div>
      <button className="btn-primary text-sm px-3 py-2" onClick={() => setOpen(true)}>Generate AI (Gemini)</button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg w-11/12 max-w-3xl">
            <h3 className="text-lg font-bold mb-3">Generate AI Suggestion (Gemini)</h3>

            <div className="grid grid-cols-1 gap-3 mb-3">
              <label className="text-xs">API Key</label>
              <input className="input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Paste your Gemini/Google API key here (kept in browser)" />
              <label className="text-xs">Model</label>
              <input className="input" value={model} onChange={e => setModel(e.target.value)} />
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-600">Transcript preview (truncated):</p>
              <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap max-h-40 overflow-auto">{transcript ? transcript.substring(0,2000) : '—'}</div>
            </div>

            <div className="flex gap-2">
              <button className="btn-primary" onClick={callGemini} disabled={loading}>{loading ? 'Generating...' : 'Generate'}</button>
              <button className="btn-secondary" onClick={() => setOpen(false)}>Close</button>
            </div>

            {error && <div className="mt-3 text-red-600">{error}</div>}

            {result && (
              <div className="mt-4">
                <h4 className="font-semibold">AI Result</h4>
                <pre className="bg-gray-100 p-3 rounded max-h-64 overflow-auto text-sm">{JSON.stringify(result.parsed, null, 2)}</pre>
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary text-sm" onClick={() => saveToServer(true)}>Accept & Save</button>
                  <button className="btn-secondary text-sm" onClick={() => saveToServer(false)}>Save Draft</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
