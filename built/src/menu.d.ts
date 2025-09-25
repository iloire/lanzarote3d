import React from "react";
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
    };
    navigateTo(story: string): void;
    render(): React.JSX.Element;
}
export default Menu;
//# sourceMappingURL=menu.d.ts.map