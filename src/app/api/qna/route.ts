import { NextResponse } from 'next/server';
import { supabase } from '@/lib/superbase';

export const revalidate = 86400;

type QnARow = {
  id: number;
  question: string;
  answer: string;
  display_order: number | null;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('qna')
      .select(`
        id,
        question,
        answer,
        display_order
      `)
      .order('display_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('Supabase qna query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch qna data' },
        { status: 500 }
      );
    }

    const transformedData = ((data ?? []) as QnARow[]).map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching qna:', error);
    return NextResponse.json(
      { error: 'Failed to fetch qna data' },
      { status: 500 }
    );
  }
}