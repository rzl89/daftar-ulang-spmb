import { useState, useEffect } from 'react';

export interface LandingBlock {
  id: number;
  type: string;
  content: any;
  sortOrder: number;
  isActive: boolean;
}

export function useLandingBlocks() {
  const [blocks, setBlocks] = useState<LandingBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await fetch('/api/landing-blocks');
        if (res.ok) {
          const data = await res.json();
          setBlocks(data);
        }
      } catch (err) {
        console.error('Failed to fetch landing blocks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  return { blocks, loading };
}
