import { NextResponse } from 'next/server';
import { supabase } from '@/lib/superbase';

export const revalidate = 86400;

type ProjectRow = {
  id: number;
  public_url: string | null;
  year: string | null;
  image_path: string | null;
  name: string | null;
  description: string | null;
};

type ProjectAwardRow = {
  project_id: number;
  award_id: string;
  award_name: string;
};

export async function GET() {
  try {
    const [{ data: projects, error: projectsError }, { data: projectAwards, error: awardsError }] =
      await Promise.all([
        supabase
          .from('projects')
          .select(`
            id,
            public_url,
            year,
            image_path,
            name,
            description
          `)
          .order('year', { ascending: false })
          .order('name', { ascending: true }),
        supabase
          .from('project_awards')
          .select(`
            project_id,
            award_id,
            award_name
          `),
      ]);

    if (projectsError) {
      console.error('Supabase projects query error:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects data' },
        { status: 500 }
      );
    }

    if (awardsError) {
      console.error('Supabase project_awards query error:', awardsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects awards data' },
        { status: 500 }
      );
    }

    const awardsMap = new Map<number, { id: string; name: string }[]>();

    for (const row of (projectAwards ?? []) as ProjectAwardRow[]) {
      const current = awardsMap.get(row.project_id) ?? [];
      current.push({
        id: row.award_id,
        name: row.award_name,
      });
      awardsMap.set(row.project_id, current);
    }

    const transformedData = ((projects ?? []) as ProjectRow[]).map((project) => {
      let image: string | null = null;

      if (project.image_path) {
        const { data: imageData } = supabase.storage
          .from('site-assets')
          .getPublicUrl(project.image_path);

        image = imageData.publicUrl;
      }

      return {
        id: project.id,
        public_url: project.public_url,
        year: project.year,
        image,
        name: project.name,
        description: project.description,
        awards: awardsMap.get(project.id) ?? [],
      };
    });

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects data' },
      { status: 500 }
    );
  }
}