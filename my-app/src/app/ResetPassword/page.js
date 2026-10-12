import { Suspense } from 'react';
import ResetForm from './ResetForm';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<p className="text-center mt-8">Loading...</p>}>
            <ResetForm />
        </Suspense>
    );
}
