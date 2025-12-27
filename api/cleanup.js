
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Check for authorization (optional but recommended: e.g., a shared secret or Vercel's internal headers)
    // For simplicity, we'll proceed, but in production, you might want to verify the request.

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        return res.status(500).json({ error: 'Supabase environment variables are not set' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    try {
        // 1. Fetch files that have expired
        // We delete anything where expires_at < NOW()
        const now = new Date().toISOString()

        const { data: expiredFiles, error: fetchError } = await supabase
            .from('shared_files')
            .select('id, file_path, bucket_id')
            .not('expires_at', 'is', null) // Only check files with expiration
            .lt('expires_at', now)

        if (fetchError) throw fetchError;

        if (!expiredFiles || expiredFiles.length === 0) {
            return res.status(200).json({ message: 'No expired files to cleanup' });
        }

        console.log(`Found ${expiredFiles.length} expired files. Cleaning up...`)

        // 2. Delete files from storage
        // We need to group by bucket_id to delete efficiently
        const filesByBucket = expiredFiles.reduce((acc, file) => {
            const bucket = file.bucket_id || 'shared-files-public' 
            // Default to public if bucket_id missing (legacy files)
            if (!acc[bucket]) acc[bucket] = []
            acc[bucket].push(file.file_path)
            return acc
        }, {})

        for (const [bucket, paths] of Object.entries(filesByBucket)) {
            const { error: storageError } = await supabase.storage
                .from(bucket)
                .remove(paths);
            
            if (storageError) console.error(`Error deleting from ${bucket}:`, storageError);
        }

        // 3. Delete records from database
        const fileIds = expiredFiles.map(f => f.id);
        const { error: dbError } = await supabase
            .from('shared_files')
            .delete()
            .in('id', fileIds);

        if (dbError) throw dbError;

        return res.status(200).json({
            message: `Successfully cleaned up ${expiredFiles.length} expired files`,
            deletedCount: expiredFiles.length
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return res.status(500).json({ error: 'Internal server error during cleanup', details: error.message });
    }
};
