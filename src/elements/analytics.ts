import ReactGA from "react-ga4";
ReactGA.initialize("G-EMLJN9ZJ6H");

const category = "game";
class Analytics {
  constructor() {}
  trackEvent(action: string) {
    console.log("track", action);
    ReactGA.event({
      category,
      action,
      // label: "", // optional
      // value: 99, // optional, must be a number
      // nonInteraction: true, // optional, true/false
      // transport: "xhr", // optional, beacon/xhr/image
    });
  }
}
export default Analytics;
