import { Head, Link } from '@inertiajs/react';
import { home } from '@/routes';

export default function TermsAndConditions() {
    return (
        <>
            <Head title="Terms and Conditions">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <header className="border-b border-[#e3e3e0] bg-white px-6 py-4 dark:border-[#3E3E3A] dark:bg-[#161615]">
                    {/* <div className="mx-auto max-w-4xl">
                        <Link
                            href={home()}
                            className="inline-block text-sm text-[#706f6c] hover:text-[#1b1b18] dark:text-[#A1A09A] dark:hover:text-[#EDEDEC]"
                        >
                            ← Back to Home
                        </Link>
                    </div> */}
                </header>
                <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
                    <h1 className="mb-8 text-4xl font-semibold">
                        Terms and Conditions
                    </h1>
                    <div className="prose prose-stone max-w-none dark:prose-invert">
                        <p className="text-[#706f6c] dark:text-[#A1A09A]">
                            Last updated: December 22, 2025
                        </p>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                1. Acceptance of Terms
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                By accessing and using this service, you accept
                                and agree to be bound by the terms and provision
                                of this agreement. If you do not agree to abide
                                by the above, please do not use this service.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                2. Use License
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                Permission is granted to temporarily access the
                                materials (information or software) on this
                                application for personal, non-commercial
                                transitory viewing only. This is the grant of a
                                license, not a transfer of title, and under this
                                license you may not:
                            </p>
                            <ul className="mb-4 ml-6 list-disc space-y-2 text-[#706f6c] dark:text-[#A1A09A]">
                                <li>Modify or copy the materials</li>
                                <li>
                                    Use the materials for any commercial purpose,
                                    or for any public display (commercial or
                                    non-commercial)
                                </li>
                                <li>
                                    Attempt to decompile or reverse engineer any
                                    software contained in this application
                                </li>
                                <li>
                                    Remove any copyright or other proprietary
                                    notations from the materials
                                </li>
                                <li>
                                    Transfer the materials to another person or
                                    "mirror" the materials on any other server
                                </li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                3. Disclaimer
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                The materials within this application are
                                provided on an 'as is' basis. We make no
                                warranties, expressed or implied, and hereby
                                disclaim and negate all other warranties
                                including, without limitation, implied warranties
                                or conditions of merchantability, fitness for a
                                particular purpose, or non-infringement of
                                intellectual property or other violation of
                                rights.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                4. Limitations
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                In no event shall we or our suppliers be liable
                                for any damages (including, without limitation,
                                damages for loss of data or profit, or due to
                                business interruption) arising out of the use or
                                inability to use the materials on this
                                application, even if we or our authorized
                                representative has been notified orally or in
                                writing of the possibility of such damage.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                5. Accuracy of Materials
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                The materials appearing in this application could
                                include technical, typographical, or photographic
                                errors. We do not warrant that any of the
                                materials on its application are accurate,
                                complete, or current. We may make changes to the
                                materials contained in this application at any
                                time without notice.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                6. Links
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We have not reviewed all of the sites linked to
                                this application and are not responsible for the
                                contents of any such linked site. The inclusion
                                of any link does not imply endorsement by us of
                                the site. Use of any such linked website is at
                                the user's own risk.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                7. Modifications
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We may revise these terms of service for its
                                application at any time without notice. By using
                                this application you are agreeing to be bound by
                                the then current version of these terms of
                                service.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                8. Governing Law
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                These terms and conditions are governed by and
                                construed in accordance with the laws and you
                                irrevocably submit to the exclusive jurisdiction
                                of the courts in that location.
                            </p>
                        </section>
                    </div>
                </main>
                <footer className="border-t border-[#e3e3e0] bg-white px-6 py-6 dark:border-[#3E3E3A] dark:bg-[#161615]">
                    <div className="mx-auto max-w-4xl text-center text-sm text-[#706f6c] dark:text-[#A1A09A]">
                        <p>
                            If you have any questions about these Terms and
                            Conditions, please contact us.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
