-- Publiczny dostęp do ODCZYTU wszystkich zdjęć
CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- Upload tylko do folderu z własnym user_id
CREATE POLICY "Users can upload to their folder" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update tylko własnych plików
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete tylko własnych plików
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);