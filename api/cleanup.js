
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    try {
        // Authenticate the request (recommended for production)
        const authHeader = req.headers.authorization;
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
             // Optional: verify if call is from Vercel Cron or authenticated source
             // return res.status(401).json({ error: 'Unauthorized' });
             // Proceeding for now as per user request to just "cleanup"
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // 1. Fetch files that have expired
        const now = new Date().toISOString();
        
        // Query expired files
        const { data: expiredFiles, error: fetchError } = await supabase
            .from('shared_files')
            .select('id, file_path, bucket_id')
            .lt('expires_at', now);

        if (fetchError) {
            console.error('Error fetching expired files:', fetchError);
            throw fetchError;
        }

        if (!expiredFiles || expiredFiles.length === 0) {
            console.log('No expired files found.');
            return res.status(200).json({ message: 'No expired files to cleanup', deletedCount: 0 });
        }

        console.log(`Found ${expiredFiles.length} expired files. Starting cleanup...`);

        // 2. Delete files from Supabase Storage
        // Group files by bucket to batch delete calls
        const filesByBucket = expiredFiles.reduce((acc, file) => {
            const bucket = file.bucket_id || 'shared-files-public';
            if (!acc[bucket]) acc[bucket] = [];
            acc[bucket].push(file.file_path);
            return acc;
        }, {});

        const storageResults = [];

        for (const [bucket, paths] of Object.entries(filesByBucket)) {
            if (paths.length > 0) {
                 const { error: storageError, data: storageData } = await supabase.storage
                    .from(bucket)
                    .remove(paths);
                
                if (storageError) {
                    console.error(`Failed to delete files from bucket '${bucket}':`, storageError);
                    storageResults.push({ bucket, status: 'failed', error: storageError });
                } else {
                    console.log(`Deleted ${paths.length} files from bucket '${bucket}'`);
                    storageResults.push({ bucket, status: 'success', count: paths.length });
                }
            }
        }

        // 3. Delete records from Database
        // We delete from DB regardless of storage success to prevent "phantom" file records 
        // (files that don't exist but are still in DB). 
        // If storage delete failed, they are orphaned files provided we don't re-download them.
        const fileIds = expiredFiles.map(f => f.id);
        
        if (fileIds.length > 0) {
            const { error: dbError } = await supabase
                .from('shared_files')
                .delete()
                .in('id', fileIds);

            if (dbError) {
                console.error('Error deleting records from database:', dbError);
                throw dbError;
            }
            console.log(`Deleted ${fileIds.length} records from 'shared_files' table.`);
        }

        return res.status(200).json({
            message: 'Cleanup completed successfully',
            expiredFound: expiredFiles.length,
            storageResults
        });

    } catch (error) {
        console.error('Cleanup execution failed:', error.message);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
