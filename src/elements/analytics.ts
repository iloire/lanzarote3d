import ReactGA from "react-ga4";
ReactGA.initialize("G-EMLJN9ZJ6H");

const category = "game";
const version = "v0.05";

ReactGA.gtag("set", "user_properties", {
  app_version: version,
});

class Analytics {
  trackEvent(action: string, label?: string) {
    ReactGA.event({
      category,
      action,
      label: label || "", // optional
      // value: 99, // optional, must be a number
      // nonInteraction: true, // optional, true/false
      // transport: "xhr", // optional, beacon/xhr/image
    });
  }
}
export default Analytics;
