"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface ProjectData {
  activities: any[] | null;
  loading: boolean;
  error: string | null;
  fetchActivities: () => Promise<any[]>;
  lastFetched: number | null;
}

const ProjectDataContext = createContext<ProjectData>({
  activities: null,
  loading: false,
  error: null,
  fetchActivities: async () => [],
  lastFetched: null,
});

export function ProjectDataProvider({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const [activities, setActivities] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const fetchingRef = useRef(false);

  const fetchActivities = useCallback(async () => {
    // Return cached data if fetched within last 30 seconds
    if (activities && lastFetched && Date.now() - lastFetched < 30000) {
      return activities;
    }

    // Prevent duplicate fetches
    if (fetchingRef.current) return activities || [];
    fetchingRef.current = true;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/activities`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      const data = await res.json();
      const acts = data.activities || data;
      setActivities(acts);
      setLastFetched(Date.now());
      return acts;
    } catch (e: any) {
      setError(e.message);
      return activities || [];
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [projectId, activities, lastFetched]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchActivities();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ProjectDataContext.Provider value={{ activities, loading, error, fetchActivities, lastFetched }}>
      {children}
    </ProjectDataContext.Provider>
  );
}

export function useProjectData() {
  return useContext(ProjectDataContext);
}
