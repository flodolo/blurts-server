"use strict";

const home = require("../../controllers/home");


let mockRequest = { fluentFormat: jest.fn() };

function addBreachesToMockRequest(mockRequest) {
  const mockBreaches = [
    {Name: "Test"},
    {Name: "DontShow"},
  ];
  mockRequest.app = { locals: { breaches: mockBreaches } };
  return mockRequest;
}

test("home GET without breach renders monitor without breach", () => {
  mockRequest.query = { breach: null };
  mockRequest = addBreachesToMockRequest(mockRequest);
  const mockResponse = { render: jest.fn() };

  home.home(mockRequest, mockResponse);

  const mockRenderCallArgs = mockResponse.render.mock.calls[0];
  expect(mockRenderCallArgs[0]).toBe("monitor");
  expect(mockRenderCallArgs[1].featuredBreach).toBe(null);
});


test("home GET with breach renders monitor with breach", () => {
  const testBreach = {Name: "Test"};
  mockRequest.query = { breach: testBreach.Name };
  mockRequest = addBreachesToMockRequest(mockRequest);
  const mockResponse = { render: jest.fn() };

  home.home(mockRequest, mockResponse);

  const mockRenderCallArgs = mockResponse.render.mock.calls[0];
  expect(mockRenderCallArgs[0]).toBe("monitor");
  expect(mockRenderCallArgs[1].featuredBreach).toEqual(testBreach);
});


test("notFound set status 404 and renders 404", () => {
  const mockResponse = { status: jest.fn(), render: jest.fn() };

  home.notFound(mockRequest, mockResponse);

  const mockStatusCallArgs = mockResponse.status.mock.calls[0];
  const mockRenderCallArgs = mockResponse.render.mock.calls[0];
  expect(mockStatusCallArgs[0]).toBe(404);
  expect(mockRenderCallArgs[0]).toBe("error");
});
