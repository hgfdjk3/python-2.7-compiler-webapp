import { useState, useMemo } from 'react';
import { Source, SourceGroup } from './types';

export const useSourceFilter = (sources: Source[], groups: SourceGroup[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    sources.forEach((s) => types.add(s.type));
    groups.forEach((g) => g.sources.forEach((s) => types.add(s.type)));
    return Array.from(types).filter(Boolean);
  }, [sources, groups]);

  const { filteredGroups, filteredSources } = useMemo(() => {
    const query = searchQuery.toLowerCase();

    const filterSource = (s: Source) => {
      const matchesQuery =
        !query ||
        s.title.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query));
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(s.type);
      return matchesQuery && matchesType;
    };

    const nextSources = sources.filter(filterSource);
    const nextGroups = groups.map((g) => ({
      ...g,
      sources: g.sources.filter(filterSource),
    }));

    return {
      filteredGroups: nextGroups.filter((g) => g.sources.length > 0),
      filteredSources: nextSources,
    };
  }, [sources, groups, searchQuery, selectedTypes]);

  return {
    searchQuery,
    setSearchQuery,
    selectedTypes,
    setSelectedTypes,
    availableTypes,
    filteredGroups,
    filteredSources,
  };
};
