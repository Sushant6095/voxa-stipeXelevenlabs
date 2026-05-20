'use client';

import { ProgressBar } from '@tremor/react';
import { Loader2, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import {
  deleteKnowledgeSource,
  ingestKnowledgeUrl,
} from '@/app/(app)/knowledge/actions';
import type { KnowledgeBaseEntry } from '@/lib/supabase/types';

interface KnowledgeFormProps {
  initialSources: KnowledgeBaseEntry[];
}

export function KnowledgeForm({ initialSources }: KnowledgeFormProps) {
  const [url, setUrl] = useState('');
  const [sources, setSources] = useState<KnowledgeBaseEntry[]>(initialSources);
  const [isIngesting, startIngest] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    startIngest(async () => {
      const result = await ingestKnowledgeUrl(trimmed);
      if (result.ok) {
        toast.success('Source queued for ingestion', { description: trimmed });
        setUrl('');
        // optimistically add a placeholder; server revalidation will refresh
        setSources((prev) => [
          {
            id: crypto.randomUUID(),
            business_id: '',
            source_url: trimmed,
            content: '',
            embedded_at: null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        toast.error(result.error ?? 'Ingestion failed');
      }
    });
  };

  const onDelete = (id: string) => {
    setDeletingId(id);
    startIngest(async () => {
      const result = await deleteKnowledgeSource(id);
      if (result.ok) {
        setSources((prev) => prev.filter((s) => s.id !== id));
        toast.success('Source removed');
      } else {
        toast.error(result.error ?? 'Could not remove source');
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://your-business.com/menu"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isIngesting}
          className="sm:flex-1"
          required
        />
        <ShimmerButton
          background="#6366F1"
          shimmerColor="#ffffff"
          className="shrink-0"
          disabled={isIngesting || !url.trim()}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            {isIngesting ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : null}
            Ingest
          </span>
        </ShimmerButton>
      </form>

      {isIngesting && (
        <ProgressBar value={66} color="indigo" className="h-1.5" />
      )}

      <div className="space-y-2">
        {sources.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            No knowledge sources yet. Paste a URL above to start.
          </p>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"
            >
              <a
                href={source.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-primary"
              >
                {source.source_url}
              </a>
              <span className="shrink-0 text-xs text-muted-foreground">
                {source.embedded_at ? 'Ready' : 'Queued'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(source.id)}
                disabled={deletingId === source.id}
                aria-label="Delete source"
              >
                {deletingId === source.id ? (
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                ) : (
                  <Trash2 aria-hidden className="size-4" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
