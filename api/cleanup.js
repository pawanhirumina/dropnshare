
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
        // 1. Calculate the cutoff time (24 hours ago)
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 2. Fetch files that have expired
        const { data: expiredFiles, error: fetchError } = await supabase
            .from('shared_files')
            .select('id, file_path')
            .lt('created_at', cutoffDate);

        if (fetchError) throw fetchError;

        if (!expiredFiles || expiredFiles.length === 0) {
            return res.status(200).json({ message: 'No expired files to cleanup' });
        }

        // 3. Delete files from storage
        const filePaths = expiredFiles.map(f => f.file_path);
        const { error: storageError } = await supabase.storage
            .from('shared-files')
            .remove(filePaths);

        if (storageError) {
            console.error('Error deleting from storage:', storageError);
            // We continue to delete from DB even if some storage deletion failed, or handle partially
        }

        // 4. Delete records from database
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
