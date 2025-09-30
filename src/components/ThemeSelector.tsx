import { Component } from 'react';
import { themeManager } from '../foundation/systems/ThemeManager';
import { Theme } from '../foundation/types/Theme';

interface ThemeSelectorProps {
  isMobile?: boolean;
  onMobileThemeSelect?: () => void;
}

interface ThemeSelectorState {
  isOpen: boolean;
  currentTheme: Theme | null;
  availableThemes: Theme[];
  isReady: boolean;
  isApplying: boolean;
}

class ThemeSelector extends Component<ThemeSelectorProps, ThemeSelectorState> {
  private themeChangeListener: (theme: Theme) => void;

  constructor(props: ThemeSelectorProps) {
    super(props);

    this.state = {
      isOpen: false,
      currentTheme: null,
      availableThemes: [],
      isReady: false,
      isApplying: false,
    };

    // Bind theme change listener
    this.themeChangeListener = this.handleThemeChange.bind(this);
  }

  override componentDidMount() {
    // Add theme change listener
    themeManager.addListener(this.themeChangeListener);

    // Initialize state
    this.updateState();

    // Check if theme manager becomes ready periodically
    this.checkThemeManagerReady();
  }

  override componentWillUnmount() {
    // Remove theme change listener
    themeManager.removeListener(this.themeChangeListener);
  }

  checkThemeManagerReady = () => {
    const checkInterval = setInterval(() => {
      if (themeManager.isReady()) {
        this.updateState();
        clearInterval(checkInterval);
      }
    }, 100);

    // Stop checking after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  };

  updateState = () => {
    this.setState({
      isReady: themeManager.isReady(),
      currentTheme: themeManager.getCurrentTheme(),
      availableThemes: themeManager.getAvailableThemes(),
    });
  };

  handleThemeChange = (theme: Theme) => {
    this.setState({
      currentTheme: theme,
      isApplying: false,
    });
  };

  toggleOpen = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  handleThemeSelect = async (themeId: string) => {
    if (this.state.isApplying) return;

    this.setState({ isApplying: true });

    try {
      await themeManager.applyTheme(themeId);
      // On mobile, close the menu after theme selection for better UX
      if (this.props.isMobile) {
        this.setState({ isOpen: false });
        // Also close the parent mobile menu if callback provided
        if (this.props.onMobileThemeSelect) {
          this.props.onMobileThemeSelect();
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to apply theme:', error);
    } finally {
      this.setState({ isApplying: false });
    }
  };

  getThemeColor = (theme: Theme): string => {
    // Extract predominant color from theme
    switch (theme.id) {
      case 'default':
        return '#616161';
      case 'golden':
        return '#FFD700';
      case 'arctic':
        return '#87CEEB';
      case 'storm':
        return '#4A4A4A';
      case 'autumn':
        return '#CD853F';
      case 'natural':
        return '#2196f3';
      default:
        return '#4CAF50';
    }
  };

  renderThemeButton = (theme: Theme) => {
    const { currentTheme, isApplying } = this.state;
    const isActive = currentTheme?.id === theme.id;
    const isDisabled = isApplying;
    const themeColor = this.getThemeColor(theme);

    return (
      <button
        key={theme.id}
        onClick={() => this.handleThemeSelect(theme.id)}
        disabled={isDisabled}
        style={{
          background: isActive
            ? themeColor
            : `linear-gradient(135deg, ${themeColor}88, ${themeColor}44)`,
          color: 'white',
          border: isActive ? `2px solid ${themeColor}` : `1px solid ${themeColor}66`,
          borderRadius: '4px',
          padding: '8px 12px',
          margin: '2px',
          fontSize: '14px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
          minWidth: '120px',
          textAlign: 'center' as const,
          display: 'block',
          width: '100%',
          transition: 'all 0.2s ease',
          fontWeight: 'bold',
        }}
      >
        {theme.name}
      </button>
    );
  };

  renderMobileView = () => {
    const { isOpen, isReady, currentTheme, availableThemes, isApplying } = this.state;

    if (!isReady) {
      return (
        <div style={{ padding: '10px', color: 'white', fontSize: '12px' }}>
          🎨 Theme system loading...
        </div>
      );
    }

    return (
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={this.toggleOpen}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 15px',
            fontSize: '14px',
            width: '100%',
            cursor: 'pointer',
            marginBottom: '5px',
          }}
        >
          🎨 Theme: {currentTheme?.name || 'Default Theme'}
        </button>

        {isOpen && (
          <div
            style={{
              background: 'rgba(0,0,0,0.9)',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '10px',
              position: 'relative' as const,
            }}
          >
            <button
              onClick={this.toggleOpen}
              style={{
                position: 'absolute' as const,
                top: '5px',
                right: '5px',
                background: 'transparent',
                border: 'none',
                color: '#999',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '2px',
                lineHeight: '1',
                zIndex: 10000,
              }}
              title="Close theme selector"
            >
              ✕
            </button>

            {isApplying && (
              <div style={{ color: '#4CAF50', fontSize: '12px', marginBottom: '10px' }}>
                🔄 Applying theme...
              </div>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
              {availableThemes.map(this.renderThemeButton)}
            </div>
          </div>
        )}
      </div>
    );
  };

  renderDesktopView = () => {
    const { isOpen, isReady, currentTheme, availableThemes, isApplying } = this.state;

    if (!isReady) {
      return (
        <div className="button">
          <button
            disabled
            style={{
              background: '#666',
              color: '#ccc',
              cursor: 'not-allowed',
            }}
          >
            🎨 Loading themes...
          </button>
        </div>
      );
    }

    return (
      <div className="button" style={{ marginBottom: '10px' }}>
        <button
          onClick={this.toggleOpen}
          style={{
            background: isOpen ? '#4CAF50' : '#4CAF50',
            color: 'white',
            fontWeight: 'bold',
            position: 'relative' as const,
          }}
          title="Change application theme"
        >
          🎨 {currentTheme?.name || 'Default Theme'}
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute' as const,
              left: '100%',
              top: '0',
              background: 'rgba(0,0,0,0.95)',
              border: '2px solid #4CAF50',
              borderRadius: '8px',
              padding: '15px',
              minWidth: '280px',
              zIndex: 9999,
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            }}
          >
            <button
              onClick={this.toggleOpen}
              style={{
                position: 'absolute' as const,
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: '#999',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '2px',
                lineHeight: '1',
                transition: 'color 0.2s ease',
                zIndex: 10000,
              }}
              title="Close theme selector"
              onMouseEnter={e => {
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#999';
              }}
            >
              ✕
            </button>

            {isApplying && (
              <div
                style={{
                  color: '#4CAF50',
                  fontSize: '12px',
                  marginBottom: '10px',
                  textAlign: 'center' as const,
                }}
              >
                🔄 Applying theme...
              </div>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
              {availableThemes.map(this.renderThemeButton)}
            </div>
          </div>
        )}
      </div>
    );
  };

  override render() {
    const { isMobile } = this.props;

    return isMobile ? this.renderMobileView() : this.renderDesktopView();
  }
}

export default ThemeSelector;
