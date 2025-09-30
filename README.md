# lanzarote 3d

## Setup

### AWS Configuration

This project uses AWS S3 for deployment. You need to configure AWS CLI with the `lanzaroteparagliding` profile:

1. Install AWS CLI if you haven't already:
   ```bash
   # On macOS
   brew install awscli

   # On Linux/Windows
   # Follow instructions at https://aws.amazon.com/cli/
   ```

2. Configure the AWS profile:
   ```bash
   aws configure --profile lanzaroteparagliding
   ```

   You'll be prompted to enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `eu-west-1`)
   - Default output format (e.g., `json`)

3. Verify the profile is set up correctly:
   ```bash
   aws s3 ls --profile lanzaroteparagliding
   ```

### Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

#### Dev Mode in Production

By default, only public apps are visible in production. To access private/hidden apps and dev tools in production:

**Enable dev mode:**
1. Open browser console on the production site
2. Run: `enableDevMode()`
3. Reload the page

**Disable dev mode:**
```javascript
disableDevMode()
```

**Manual control:**
```javascript
// Enable
localStorage.setItem('lanzarote_dev_mode', 'true')

// Disable
localStorage.removeItem('lanzarote_dev_mode')
```

When dev mode is enabled in production, you'll see "🔓 Secret dev mode enabled" in the console and have access to all private apps (workshop-demo, location-editor, tile-debug, etc.).

### Deployment

The project can be deployed to different S3 buckets:

```bash
# Deploy to staging environment
yarn deploy-staging

# Deploy to flyzones environment
yarn deploy-flyzones

# Deploy to placeholder environment
yarn deploy-placeholder
```

All deployment scripts automatically use the `lanzaroteparagliding` AWS profile.

## TODO

- wing selection
- fix application of wind arrow
- unit testing
- add birds

## Screenshots

![Screenshot](https://raw.githubusercontent.com/iloire/lanzarote3d/master/screenshots/screenshot3.png)

## Height map

## Credits / inspiration

- [https://github.com/dragonir/3d](https://github.com/dragonir/3d)
- [https://www.soundjay.com/wind-sound-effect.html](https://www.soundjay.com/wind-sound-effect.html)
- [https://www.audiocheck.net/audiofrequencysignalgenerator_sinetone.php](https://www.audiocheck.net/audiofrequencysignalgenerator_sinetone.php)
- ["Birds" by Zacxophone](https://skfb.ly/6ZEHR)

## Dev notebook

## Feat

- Add sucking clouds
- Fix sea collisions
- Select weather conditions
- Add rain
- Select time of day
- XC competition mode (scoring)
- Pilot landing mode (doesn't crash at low speed) but loses performance
- Ears model modification
- Speed models modification
- Better spiral physics
- Skyboxes or better sky shader
- Thermals and clouds evolve through the day
- Time changes through the day
- Display time in the screen
- Airspace restrictions (Adri's idea)
- Enable/disable Thermals or only show in certain views
- Boat comes to rescue if you fall in the water.
- Web workers.

## Fix

- Turn auto-fliers according to their direction (smooth turns ideally)
- Auto-fliers speed according to wrap speed
- Fix pause over starting menu
- Loading progress
- Pilot harness visibility
- Decouple vario, camera, ui from Flier
