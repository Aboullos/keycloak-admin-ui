import React, { ReactNode, useEffect } from "react";
import { Page } from "@patternfly/react-core";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useParams,
} from "react-router-dom";

import { Header } from "./PageHeader";
import { PageNav } from "./PageNav";
import { Help } from "./components/help-enabler/HelpHeader";

import { ServerInfoProvider } from "./context/server-info/ServerInfoProvider";
import { AlertProvider } from "./components/alert/Alerts";

import { AccessContextProvider, useAccess } from "./context/access/Access";
import { routes, RouteDef } from "./route-config";
import { PageBreadCrumbs } from "./components/bread-crumb/PageBreadCrumbs";
import { ForbiddenSection } from "./ForbiddenSection";
import { SubGroups } from "./groups/GroupsSection";
import { useRealm } from "./context/realm-context/RealmContext";
import { useAdminClient, asyncStateFetch } from "./context/auth/AdminClient";

// This must match the id given as scrollableSelector in scroll-form
const mainPageContentId = "kc-main-content-page-container";

const AppContexts = ({ children }: { children: ReactNode }) => (
  <AccessContextProvider>
    <Help>
      <AlertProvider>
        <ServerInfoProvider>
          <SubGroups>{children}</SubGroups>
        </ServerInfoProvider>
      </AlertProvider>
    </Help>
  </AccessContextProvider>
);

// set the realm form the path if it's one of the know realms
const RealmPathSelector = ({ children }: { children: ReactNode }) => {
  const { setRealm } = useRealm();
  const { realm } = useParams<{ realm: string }>();
  const adminClient = useAdminClient();
  useEffect(
    () =>
      asyncStateFetch(
        () => adminClient.realms.find(),
        (realms) => {
          if (realms.findIndex((r) => r.realm == realm) !== -1) {
            setRealm(realm);
          }
        }
      ),
    []
  );

  return <>{children}</>;
};

// If someone tries to go directly to a route they don't
// have access to, show forbidden page.
type SecuredRouteProps = { route: RouteDef };
const SecuredRoute = ({ route }: SecuredRouteProps) => {
  const { hasAccess } = useAccess();
  if (hasAccess(route.access)) return <route.component />;

  return <ForbiddenSection />;
};

export const App = () => {
  return (
    <AppContexts>
      <Router>
        <Page
          header={<Header />}
          isManagedSidebar
          sidebar={<PageNav />}
          breadcrumb={<PageBreadCrumbs />}
          mainContainerId={mainPageContentId}
        >
          <Switch>
            {routes(() => {}).map((route, i) => (
              <Route
                exact={
                  route.matchOptions?.exact === undefined
                    ? true
                    : route.matchOptions.exact
                }
                key={i}
                path={route.path}
                component={() => (
                  <RealmPathSelector>
                    <SecuredRoute route={route} />
                  </RealmPathSelector>
                )}
              />
            ))}
          </Switch>
        </Page>
      </Router>
    </AppContexts>
  );
};
