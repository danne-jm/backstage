import { Head, Link } from '@inertiajs/react';
import { home } from '@/routes';

export default function PrivacyPolicy() {
    return (
        <>
            <Head title="Privacy Policy">
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
                        Privacy Policy
                    </h1>
                    <div className="prose prose-stone max-w-none dark:prose-invert">
                        <p className="text-[#706f6c] dark:text-[#A1A09A]">
                            Last updated: December 22, 2025
                        </p>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                1. Information We Collect
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We collect information that you provide directly
                                to us when you create an account, use our
                                services, or communicate with us. This may
                                include:
                            </p>
                            <ul className="mb-4 ml-6 list-disc space-y-2 text-[#706f6c] dark:text-[#A1A09A]">
                                <li>Name and contact information</li>
                                <li>Account credentials</li>
                                <li>Profile information</li>
                                <li>Communication preferences</li>
                                <li>
                                    Any other information you choose to provide
                                </li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                2. How We Use Your Information
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We use the information we collect to:
                            </p>
                            <ul className="mb-4 ml-6 list-disc space-y-2 text-[#706f6c] dark:text-[#A1A09A]">
                                <li>Provide, maintain, and improve our services</li>
                                <li>
                                    Process transactions and send related
                                    information
                                </li>
                                <li>
                                    Send you technical notices, updates, security
                                    alerts, and support messages
                                </li>
                                <li>
                                    Respond to your comments, questions, and
                                    requests
                                </li>
                                <li>
                                    Monitor and analyze trends, usage, and
                                    activities in connection with our services
                                </li>
                                <li>
                                    Detect, investigate, and prevent fraudulent
                                    transactions and other illegal activities
                                </li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                3. Information Sharing and Disclosure
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We do not share, sell, rent, or trade your
                                personal information with third parties for their
                                commercial purposes. We may share your information
                                in the following situations:
                            </p>
                            <ul className="mb-4 ml-6 list-disc space-y-2 text-[#706f6c] dark:text-[#A1A09A]">
                                <li>
                                    With your consent or at your direction
                                </li>
                                <li>
                                    With service providers who perform services on
                                    our behalf
                                </li>
                                <li>
                                    To comply with laws or respond to legal
                                    requests
                                </li>
                                <li>
                                    To protect the rights and safety of us, our
                                    users, and others
                                </li>
                                <li>
                                    In connection with a merger, sale, or asset
                                    transfer
                                </li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                4. Data Security
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We take reasonable measures to help protect your
                                personal information from loss, theft, misuse,
                                unauthorized access, disclosure, alteration, and
                                destruction. However, no internet or email
                                transmission is ever fully secure or error-free.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                5. Data Retention
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We store your personal information for as long as
                                necessary to provide you with our services, or for
                                other important purposes such as complying with
                                legal obligations, resolving disputes, and
                                enforcing our agreements.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                6. Your Rights and Choices
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                You have certain rights regarding your personal
                                information, including:
                            </p>
                            <ul className="mb-4 ml-6 list-disc space-y-2 text-[#706f6c] dark:text-[#A1A09A]">
                                <li>
                                    Access and review your personal information
                                </li>
                                <li>
                                    Request corrections to your personal
                                    information
                                </li>
                                <li>
                                    Request deletion of your personal information
                                </li>
                                <li>
                                    Object to or restrict certain processing of
                                    your information
                                </li>
                                <li>
                                    Withdraw consent where we rely on your consent
                                    to process your information
                                </li>
                            </ul>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                7. Cookies and Tracking Technologies
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We use cookies and similar tracking technologies
                                to collect and track information about your use of
                                our services. You can control cookies through your
                                browser settings, but please note that disabling
                                cookies may affect the functionality of our
                                services.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                8. Children's Privacy
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                Our services are not directed to children under
                                the age of 13, and we do not knowingly collect
                                personal information from children under 13. If we
                                learn that we have collected personal information
                                from a child under 13, we will take steps to
                                delete such information.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                9. Changes to This Policy
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                We may update this Privacy Policy from time to
                                time. We will notify you of any changes by posting
                                the new Privacy Policy on this page and updating
                                the "Last updated" date.
                            </p>
                        </section>

                        <section className="mt-8">
                            <h2 className="mb-4 text-2xl font-medium">
                                10. Contact Us
                            </h2>
                            <p className="mb-4 leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                                If you have any questions about this Privacy
                                Policy, please contact us through the appropriate
                                channels provided in our application.
                            </p>
                        </section>
                    </div>
                </main>
                <footer className="border-t border-[#e3e3e0] bg-white px-6 py-6 dark:border-[#3E3E3A] dark:bg-[#161615]">
                    <div className="mx-auto max-w-4xl text-center text-sm text-[#706f6c] dark:text-[#A1A09A]">
                        <p>
                            Your privacy is important to us. We are committed to
                            protecting your personal information.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
