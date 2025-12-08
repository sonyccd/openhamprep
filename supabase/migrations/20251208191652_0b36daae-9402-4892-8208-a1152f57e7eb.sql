-- Add UPDATE policy for bookmarked_questions table
CREATE POLICY "Users can update their own bookmarks"
ON public.bookmarked_questions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);