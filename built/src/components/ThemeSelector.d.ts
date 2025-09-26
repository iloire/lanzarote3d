import { Component } from 'react';
import { Theme } from '../foundation/types/Theme';
interface ThemeSelectorProps {
    isMobile?: boolean;
}
interface ThemeSelectorState {
    isOpen: boolean;
    currentTheme: Theme | null;
    availableThemes: Theme[];
    isReady: boolean;
    isApplying: boolean;
}
declare class ThemeSelector extends Component<ThemeSelectorProps, ThemeSelectorState> {
    private themeChangeListener;
    constructor(props: ThemeSelectorProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    checkThemeManagerReady: () => void;
    updateState: () => void;
    handleThemeChange: (theme: Theme) => void;
    toggleOpen: () => void;
    handleThemeSelect: (themeId: string) => Promise<void>;
    renderThemeButton: (theme: Theme) => import("react/jsx-runtime").JSX.Element;
    renderMobileView: () => import("react/jsx-runtime").JSX.Element;
    renderDesktopView: () => import("react/jsx-runtime").JSX.Element;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default ThemeSelector;
//# sourceMappingURL=ThemeSelector.d.ts.map