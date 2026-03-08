import { NextResponse } from 'next/server';
import { supabase } from '@/lib/superbase';

export const revalidate = 86400;

type MemberRow = {
  id: number;
  position: string | null;
  image_path: string | null;
  name: string | null;
  generation: number | string | null;
  class: string | null;
  description: string | null;
  luna_generation: number | string | null;
};

function formatGeneration(value: number | string | null): string {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (/^\d+기$/.test(trimmed)) return trimmed;
    if (/^\d+$/.test(trimmed)) return `${trimmed}기`;
    return trimmed;
  }

  return `${value}기`;
}

function formatLunaGeneration(value: number | string | null): string {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (/^LUNA\s+\d+기$/.test(trimmed)) return trimmed;
    if (/^\d+기$/.test(trimmed)) return `LUNA ${trimmed}`;
    if (/^\d+$/.test(trimmed)) return `LUNA ${trimmed}기`;
    return trimmed;
  }

  return `LUNA ${value}기`;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select(`
        id,
        position,
        image_path,
        name,
        generation,
        class,
        description,
        luna_generation
      `)
      .order('luna_generation', { ascending: false })
      .order('generation', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase members query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members data' },
        { status: 500 }
      );
    }

    const transformedData = (data ?? []).map((member: MemberRow) => {
      let image = '';

      if (member.image_path) {
        const { data: imageData } = supabase.storage
          .from('site-assets')
          .getPublicUrl(member.image_path);

        image = imageData.publicUrl ?? '';
      }

      return {
        id: member.id,
        position: member.position ?? '',
        image,
        name: member.name ?? '',
        generation: formatGeneration(member.generation),
        class: member.class ?? '',
        description: member.description ?? '',
        lunaGeneration: formatLunaGeneration(member.luna_generation),
      };
    });

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members data' },
      { status: 500 }
    );
  }
}