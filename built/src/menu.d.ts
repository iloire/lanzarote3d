import React from 'react';
interface MenuProps {
    showPublic?: boolean;
    showExperiments?: boolean;
    showDev?: boolean;
}
declare class Menu extends React.Component<MenuProps> {
    renderer: any;
    state: {
        loadingProcess: number;
        showAppSelection: boolean;
        hoveredRoute: string | null;
        isMobile: boolean;
        isMenuOpen: boolean;
        isMenuVisible: boolean;
    };
    componentDidMount(): void;
    componentWillUnmount(): void;
    checkIfMobile: () => void;
    toggleMenu: () => void;
    toggleMenuVisibility: () => void;
    navigateTo(route: string): void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default Menu;
//# sourceMappingURL=menu.d.ts.map