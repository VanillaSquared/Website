import HeaderAuthButton from "@/components/AuthButton";
import Button from "@/components/Button";
import Card from "@/components/Card";
import SearchBar from "@/components/SearchBar";
import Tag from "@/components/Tag";
import TextInput from "@/components/TextInput";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export const metadata = {
  title: "Component Preview - Vanilla²",
};

const buttonVariants = ["primary", "secondary", "tertiary", "blue", "purple", "blurple"];
const buttonSizes = ["sm", "md", "icon"];
const cardSizes = ["sm", "md", "lg", "popup"];

export default function ComponentPreviewPage() {
  return (
    <DefaultTemplatePage search={{ placeholder: "Search components..." }}>
      <section className="bg-background px-6 py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div>
            <Tag>Dev</Tag>
            <h1 className="mt-4 text-4xl font-bold text-heading">Component Preview</h1>
            <p className="mt-3 max-w-2xl text-muted">
              A DefaultTemplate-derived page showcasing reusable components and their variants.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Buttons</h2>
            <div className="flex flex-wrap items-center gap-3">
              {buttonVariants.map((variant) => (
                <Button key={variant} href="#" variant={variant}>
                  {variant}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {buttonSizes.map((size) => (
                <Button key={size} href="#" size={size} aria-label={`Button ${size}`}>
                  {size === "icon" ? "i" : size}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Auth button</h2>
            <div className="flex flex-wrap items-center gap-3">
              <HeaderAuthButton />
              <HeaderAuthButton initialLoggedIn />
            </div>
            <p className="text-sm text-muted">
              Shows the login state and the settings state used in the header.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Cards</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Homepage preset" preset="homepage">
                <p className="text-sm text-muted">Default homepage card with hover accent.</p>
              </Card>
              <Card
                title="Auth preset"
                preset="auth"
                description="Popup-sized card with auth styling."
                footer="Footer content"
              >
                <TextInput label="Username" name="preview-username" sampleText="Steve" />
              </Card>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cardSizes.map((size) => (
                <Card key={size} title={`${size} size`} size={size}>
                  <p className="text-sm text-muted">Card size variant.</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Search bars</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <SearchBar placeholder="Default search..." />
              <SearchBar defaultValue="Vanilla²" placeholder="Filled search..." />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Inputs and tags</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Text input" name="preview-text" sampleText="Sample text" />
              <TextInput label="Password input" name="preview-password" type="password" sampleText="Secret" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag>Minecraft 26.2</Tag>
              <Tag>Fabric</Tag>
              <Tag>Java 25</Tag>
            </div>
          </section>
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
