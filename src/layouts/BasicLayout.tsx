import { Button, Divider, Icon, Layout, Menu } from "antd";
import classNames from "classnames";
import { connect } from "dva";
import { Link, Redirect, Route, routerRedux, Switch } from "dva/router";
import React, { Suspense } from "react";
import { ContainerQuery } from "react-container-query";
import { getNavData } from "../common/nav";
import { getRouteData } from "../utils/utils";

import styles from "./BasicLayout.less";

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

const query = {
  "screen-xs": {
    maxWidth: 575
  },
  "screen-sm": {
    maxWidth: 767,
    minWidth: 576
  },
  "screen-md": {
    maxWidth: 991,
    minWidth: 768
  },
  "screen-lg": {
    maxWidth: 1199,
    minWidth: 992
  },
  "screen-xl": {
    minWidth: 1200
  }
};

interface Props {
  dispatch?: (obj) => void;
  collapsed?: boolean;
  location?: {
    pathname: string;
  };
}

interface State {
  openKeys?: string[];
}

@connect(state => ({
  collapsed: state.global.collapsed
}))
export default class BasicLayout extends React.PureComponent<Props, State> {
  public menus;

  public constructor(props) {
    super(props);
    this.menus = getNavData().reduce(
      (arr, current) => arr.concat(current.children),
      []
    );
    this.state = {
      openKeys: this.getDefaultCollapsedSubMenus(props)
    };
  }

  // 折叠
  public onCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/changeLayoutCollapsed",
      payload: collapsed
    });
  };

  public getCurrentMenuSelectedKeys = (props?): [string] => {
    const {
      location: { pathname }
    } = props || this.props;
    const keys = pathname.split("/").slice(1);
    if (keys.length === 1 && keys[0] === "") {
      return [this.menus[0].key];
    }
    return keys;
  };

  public getDefaultCollapsedSubMenus = props => {
    const currentMenuSelectedKeys = [...this.getCurrentMenuSelectedKeys(props)];
    currentMenuSelectedKeys.splice(-1, 1);
    if (currentMenuSelectedKeys.length === 0) {
      return ["dashboard"];
    }
    return currentMenuSelectedKeys;
  };

  public handleOpenChange = openKeys => {
    const lastOpenKey = openKeys[openKeys.length - 1];
    const isMainMenu = this.menus.some(
      item => item.key === lastOpenKey || item.path === lastOpenKey
    );
    this.setState({
      openKeys: isMainMenu ? [lastOpenKey] : [...openKeys]
    });
  };

  public getNavMenuItems = (menusData, parentPath = "") => {
    const { location } = this.props;

    if (!menusData) {
      return [];
    }
    return menusData.map(item => {
      if (!item.name) {
        return null;
      }
      let itemPath;

      if (item.path.indexOf("http") === 0) {
        itemPath = item.path;
      } else {
        itemPath = `${parentPath}/${item.path || ""}`.replace(/\/+/g, "/");
      }

      if (item.children && item.children.some(child => child.name)) {
        return (
          <SubMenu
            title={
              item.icon ? (
                <span>
                  <Icon type={item.icon} />
                  <span>{item.name}</span>
                </span>
              ) : (
                item.name
              )
            }
            key={item.key || item.path}
          >
            {this.getNavMenuItems(item.children, itemPath)}
          </SubMenu>
        );
      }

      return (
        <Menu.Item key={item.key || item.path}>
          {/^https?:\/\//.test(itemPath) ? (
            <a href={itemPath} target={item.target}>
              <span>{item.name}</span>
            </a>
          ) : (
            <Link
              to={itemPath}
              target={item.target}
              replace={itemPath === location.pathname}
            >
              <span>{item.name}</span>
            </Link>
          )}
        </Menu.Item>
      );
    });
  };

  public toggle = () => {
    const { collapsed, dispatch } = this.props;
    dispatch({
      type: "global/changeLayoutCollapsed",
      payload: !collapsed
    });
  };

  public render() {
    const { collapsed, dispatch } = this.props;
    const { openKeys } = this.state;

    const menuProps = collapsed
      ? {}
      : {
          openKeys
        };

    const layout = (
      <Layout>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          breakpoint="md"
          onCollapse={this.onCollapse}
          width={256}
          className={styles.sider}
        >
          <div className={styles.logo}>
            <Link to="/">
              <img
                src="https://gw.alipayobjects.com/zos/rmsportal/iwWyPinUoseUxIAeElSx.svg"
                alt="logo"
              />
              <h1>Ant Design Pro</h1>
            </Link>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            {...menuProps}
            onOpenChange={this.handleOpenChange}
            selectedKeys={this.getCurrentMenuSelectedKeys()}
            style={{ margin: "16px 0", width: "100%" }}
          >
            {this.getNavMenuItems(this.menus)}
          </Menu>
        </Sider>
        <Layout>
          <Header className={styles.header}>
            <Icon
              className={styles.trigger}
              type={collapsed ? "menu-unfold" : "menu-fold"}
              onClick={this.toggle}
            />
            <Divider dashed type="vertical" style={{ height: "50px" }} />
            <Button
              htmlType="button"
              onClick={() => {
                dispatch(
                  routerRedux.push({
                    pathname: "/user/login",
                    search: ""
                  })
                );
              }}
            >
              logout
            </Button>
          </Header>
          <Content style={{ margin: "24px 24px 0", height: "100%" }}>
            <Suspense fallback={<div>Loading...</div>}>
              <Switch>
                {getRouteData("BasicLayout").map(item => {
                  const Component = item.component;

                  return Component ? (
                    <Route
                      exact={item.exact}
                      key={item.path}
                      path={item.path}
                      render={props => <Component />}
                    />
                  ) : (
                    <Route
                      exact={item.exact}
                      key={item.path}
                      path={item.path}
                      component={item.component}
                    />
                  );
                })}
                <Redirect exact from="/" to="/user/login" />
              </Switch>
            </Suspense>
          </Content>
        </Layout>
      </Layout>
    );

    return (
      <ContainerQuery query={query}>
        {params => <div className={classNames(params)}>{layout}</div>}
      </ContainerQuery>
    );
  }
}
