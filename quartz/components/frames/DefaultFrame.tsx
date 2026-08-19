import { PageFrame, PageFrameProps } from "./types"
import HeaderConstructor from "../Header"
import NavConstructor from "../Nav"
import { componentRegistry } from "../registry"

const Header = HeaderConstructor()
const Nav = NavConstructor()

// Components rendered directly by a frame are invisible to
// getComponentResources() in quartz/plugins/emitters/componentResources.ts,
// which only walks emitters and the component registry — so their css /
// afterDOMLoaded never reach the page. Register them here so the resources ship.
//
// Register the *constructors*, not the instances above: getAllComponents()
// treats every registered function as a constructor and calls it, and calling an
// already-built component just returns its JSX, yielding nothing to collect.
componentRegistry.register("frame-header", HeaderConstructor, "quartz/components/Header")
componentRegistry.register("frame-nav", NavConstructor, "quartz/components/Nav")

/**
 * The default page frame — three-column layout with left sidebar, center
 * content (header + body + afterBody), and right sidebar, followed by a footer.
 *
 * This is the original Quartz layout, extracted from renderPage.tsx.
 */
export const DefaultFrame: PageFrame = {
  name: "default",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer,
  }: PageFrameProps) {
    return (
      <>
        <div class="left sidebar">
          {left.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>
        <div class="center">
          <div class="page-header">
            <Header {...componentData}>
              {[
                ...header.map((HeaderComponent) => <HeaderComponent {...componentData} />),
                // Site nav joins the header row; custom.scss orders it between the
                // wordmark and the search/theme toolbar. Kept in one array because
                // Header's children are typed as a single list.
                <Nav {...componentData} />,
              ]}
            </Header>
            <div class="popover-hint">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
          </div>
          <Content {...componentData} />
          <hr />
          <div class="page-footer">
            {afterBody.map((BodyComponent) => (
              <BodyComponent {...componentData} />
            ))}
          </div>
        </div>
        <div class="right sidebar">
          {right.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>
        {footer.map((FooterComponent) => (
          <FooterComponent {...componentData} />
        ))}
      </>
    )
  },
}
