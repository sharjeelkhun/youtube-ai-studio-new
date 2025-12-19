import { siteConfig } from "@/lib/config"

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
            <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
                <h1>Terms of Service</h1>
                <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Introduction</h2>
                <p>
                    Welcome to {siteConfig.name}! By accessing our website at {siteConfig.url}, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>

                <h2>2. Use License</h2>
                <p>
                    Permission is granted to temporarily download one copy of the materials (information or software) on {siteConfig.name}'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul>
                    <li>modify or copy the materials;</li>
                    <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                    <li>attempt to decompile or reverse engineer any software contained on {siteConfig.name}'s website;</li>
                    <li>remove any copyright or other proprietary notations from the materials; or</li>
                    <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                </ul>
                <p>
                    This license shall automatically terminate if you violate any of these restrictions and may be terminated by {siteConfig.name} at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.
                </p>

                <h2>3. Disclaimer</h2>
                <p>
                    The materials on {siteConfig.name}'s website are provided on an 'as is' basis. {siteConfig.name} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>

                <h2>4. Limitations</h2>
                <p>
                    In no event shall {siteConfig.name} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on {siteConfig.name}'s website, even if {siteConfig.name} or a {siteConfig.name} authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
                </p>

                <h2>5. Accuracy of Materials</h2>
                <p>
                    The materials appearing on {siteConfig.name}'s website could include technical, typographical, or photographic errors. {siteConfig.name} does not warrant that any of the materials on its website are accurate, complete or current. {siteConfig.name} may make changes to the materials contained on its website at any time without notice. However {siteConfig.name} does not make any commitment to update the materials.
                </p>

                <h2>6. Modifications</h2>
                <p>
                    {siteConfig.name} may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
                </p>

                <h2>7. Governing Law</h2>
                <p>
                    These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                </p>
            </div>
        </div>
    )
}
