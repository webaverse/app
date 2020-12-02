import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import { createBrowserHistory } from "https://cdn.skypack.dev/history";

const RouterContext = React.createContext();

export const useRouter = () => {
  const context = React.useContext(RouterContext);

  const navigate = (route) => {
    if (context.cb && typeof context.cb === "function") {
      const next = context.cb(route);
      if (next) {
        context.history.push(route);
      }
    } else {
      context.history.push(route);
    }
  };

  const route = context.location;

  return { route, navigate };
};

export const Link = ({ to, children, element = "a", ...rest }) => {
  const context = React.useContext(RouterContext);

  const goto = (event) => {
    event.preventDefault();
    if (context.cb && typeof context.cb === "function") {
      const next = context.cb(to);
      if (next) {
        context.history.push(to);
      }
    } else {
      context.history.push(to);
    }
  };

  return React.createElement(
    element,
    {
      href: to,
      onClick: goto,
      ...rest,
    },
    children,
  );
};

export const Route = ({ component, path, ...rest }) => {
  console.log("Component is ")
  console.log(component);
  return React.createElement(
    "div",
    {
      ...rest,
    },
    component,
  );
};

export default ({ baseUrl = "/", cb, children }) => {
  const history = createBrowserHistory({
    basename: baseUrl,
  });
  const [location, setLocation] = React.useState(history.location.pathname);

  React.useEffect(() => {
    const unlisten = history.listen((location) => {
      setLocation(location.pathname);
    });

    return unlisten;
  }, [history]);

  const renderChildren = () => {
    const next = cb ? cb(location) : true;

    if (!next) {
      return children[children.length - 1];
    }

    let canRoute = false;
    let ErrorComponent;
    const nonRouteChildren = React.Children.map(children, (child) => {
      if (!child.props.path) {
        return child;
      }
    });

    const RouteChildToRender = React.Children.map(children, (child) => {
      if (
        typeof child.type === "function" &&
        child.props.path &&
        child.props.path === "/error"
      ) {
        ErrorComponent = child;
      }
      if (
        typeof child.type === "function" &&
        child.props.path &&
        child.props.path === location
      ) {
        canRoute = true;
        return child;
      }
    });

    const route = [...nonRouteChildren, RouteChildToRender];

    return canRoute ? route : ErrorComponent;
  };

  return React.createElement(
    RouterContext.Provider,
    { value: { history, location, cb } },
    renderChildren(),
  );
};