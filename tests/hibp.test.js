"use strict";

const got = require("got");

const AppConstants = require("../app-constants");
const getSha1 = require("../sha1-utils");
const hibp = require("../hibp");

const { testBreaches } = require("./test-breaches");


jest.mock("got");

test("req adds hibp api root, token, and standard options", async() => {
  hibp.req("/some-path");

  const gotCalls = got.mock.calls;
  expect(gotCalls.length).toEqual(1);
  const gotCallArgs = gotCalls[0];
  expect(gotCallArgs[0]).toContain(`${AppConstants.HIBP_API_ROOT}/some-path`);
  expect(gotCallArgs[0]).toContain(`?code=${encodeURIComponent(AppConstants.HIBP_API_TOKEN)}`);
  expect(gotCallArgs[1].headers["User-Agent"]).toContain("blurts-server");
  expect(gotCallArgs[1].json).toBe(true);
});


test("loadBreachesIntoApp adds app.locals.breaches|breachesLoadedDateTime|mostRecentBreachDateTime", async() => {
  got.mockClear();
  got.mockResolvedValue( { body: testBreaches });
  const app = { locals: {} };

  await hibp.loadBreachesIntoApp(app);

  const gotCalls = got.mock.calls;
  expect(gotCalls.length).toEqual(1);
  const gotCallArgs = gotCalls[0];
  expect(gotCallArgs[0]).toContain(`${AppConstants.HIBP_API_ROOT}/breaches`);
  expect(app.locals.breaches).toEqual(testBreaches);
  expect(app.locals.mostRecentBreachDateTime).toEqual(hibp.getLatestBreachDateTime(testBreaches));
});


test("filterOutUnsafeBreaches removes sensitive breaches", async() => {
  let foundSensitive = false;
  for (const breach of testBreaches) {
    if (breach.IsSensitive) {
      foundSensitive = true;
      break;
    }
  }
  expect(foundSensitive).toBe(true);


  const safeBreaches = hibp.filterOutUnsafeBreaches(testBreaches);

  for (const breach of safeBreaches) {
    expect(breach.IsSensitive).toBe(false);
    expect(breach.IsSpamList).toBe(false);
    expect(breach.IsRetired).toBe(false);
    expect(breach.IsVerified).toBe(true);
  }
});


test("getBreachesForEmail HIBP responses with status of 429 cause throttled retries up to HIBP_THROTTLE_MAX_TRIES", async() => {
  // Assumes running with max tries of 3 and delay of 1000
  jest.setTimeout(20000);
  got.mockClear();
  got.mockRejectedValue( { statusCode: 429 });

  await expect(hibp.getBreachesForEmail(getSha1("unverifiedemail@test.com"), testBreaches)).rejects.toThrow("error-hibp-throttled");

  const gotCalls = got.mock.calls;
  expect(gotCalls.length).toEqual(Number(AppConstants.HIBP_THROTTLE_MAX_TRIES));

  jest.setTimeout(5000);
});
