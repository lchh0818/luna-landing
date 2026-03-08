import { NextResponse } from 'next/server';
import { supabase } from '@/lib/superbase';

export const revalidate = 86400;

type InformationRow = {
  id: number;
  moto: string | null;
};

type AwardRow = {
  prizemoney: number | null;
};

type ProjectRow = {
  id: number;
};

function calculateTotalPrizeMoney(awards: AwardRow[]) {
  return awards.reduce((sum, award) => sum + (award.prizemoney ?? 0), 0);
}

export async function GET() {
  try {
    const [
      { data: infoData, error: infoError },
      { data: awardsData, error: awardsError },
      { data: projectsData, error: projectsError },
    ] = await Promise.all([
      supabase
        .from('information')
        .select(`
          id,
          moto
        `)
        .order('id', { ascending: true }),

      supabase
        .from('awards')
        .select(`
          prizemoney
        `),

      supabase
        .from('projects')
        .select(`
          id
        `),
    ]);

    if (infoError) {
      console.error('Supabase information query error:', infoError);
      return NextResponse.json(
        { error: 'Failed to fetch information data' },
        { status: 500 }
      );
    }

    if (awardsError) {
      console.error('Supabase awards query error:', awardsError);
      return NextResponse.json(
        { error: 'Failed to fetch awards data' },
        { status: 500 }
      );
    }

    if (projectsError) {
      console.error('Supabase projects query error:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects data' },
        { status: 500 }
      );
    }

    const baseInfo = (infoData ?? []) as InformationRow[];
    const awards = (awardsData ?? []) as AwardRow[];
    const projects = (projectsData ?? []) as ProjectRow[];

    const totalPrizeMoney = calculateTotalPrizeMoney(awards);

    const updatedInfo = baseInfo.map((info) => ({
      id: info.id,
      moto: info.moto,
      contests: (awards.length + 40).toString(),
      projects: (projects.length + 23).toString(),
      prizemoney: `${(totalPrizeMoney + 75000000).toString().slice(0, -6)}00`,
    }));

    return NextResponse.json(updatedInfo);
  } catch (error) {
    console.error('Error fetching information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch information data' },
      { status: 500 }
    );
  }
}