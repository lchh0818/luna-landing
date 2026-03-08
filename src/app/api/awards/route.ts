import { NextResponse } from 'next/server';
import { supabase } from '@/lib/superbase';

export const revalidate = 86400;

type AwardRow = {
  id: number;
  year: string | null;
  image_path: string | null;
  name: string | null;
  prize: string | null;
  team: string | null;
  members: string[] | null;
  date_start: string | null;
  date_end: string | null;
  date_time_zone: string | null;
  prizemoney: number | null;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('awards')
      .select(`
        id,
        year,
        image_path,
        name,
        prize,
        team,
        members,
        date_start,
        date_end,
        date_time_zone,
        prizemoney
      `)
      .order('date_start', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase awards query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch awards data' },
        { status: 500 }
      );
    }

    const transformedData = (data ?? []).map((award: AwardRow) => {
      let image: string | null = null;

      if (award.image_path) {
        const { data: imageData } = supabase.storage
          .from('site-assets')
          .getPublicUrl(award.image_path);

        image = imageData.publicUrl;
      }

      return {
        id: award.id,
        year: award.year,
        image,
        name: award.name,
        prize: award.prize,
        team: award.team,
        members: award.members ?? [],
        date: award.date_start
          ? {
              start: award.date_start,
              end: award.date_end,
              time_zone: award.date_time_zone,
            }
          : null,
        prizemoney: award.prizemoney,
      };
    });

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching awards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch awards data' },
      { status: 500 }
    );
  }
}