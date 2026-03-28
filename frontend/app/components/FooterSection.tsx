
const FooterSection = () => (
    <footer className="py-20 px-6 border-t border-border">
        <div className="container mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight-heading text-foreground mb-4">
                Build what's next.
            </h2>
            <p className="text-muted-foreground tracking-loose-body mb-8">
                Join the waitlist for early access.
            </p>
            <button className="text-sm font-medium bg-foreground text-background px-8 py-3 rounded-full hover:bg-foreground/90 transition-colors duration-300">
                Request Access
            </button>
            <p className="mt-16 text-xs text-muted-foreground/50">
                © 2026 ORAN. All rights reserved.
            </p>
        </div>
    </footer>
);

export default FooterSection;