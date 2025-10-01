const {
  normalizeYouTubeUrl,
  getResourcesManagement,
  updateResourcesText
} = require("../resourcesController");

const ResourcesImage = require("../../models/resourcesImage");
const ResourcesText = require("../../models/resourcesText");

jest.mock("../../models/resourcesImage");
jest.mock("../../models/resourcesText");

describe("normalizeYouTubeUrl", () => {
  it("converts youtu.be links", () => {
    const url = "https://youtu.be/LKa0ABbkGrQ";
    expect(normalizeYouTubeUrl(url)).toBe("https://www.youtube.com/embed/LKa0ABbkGrQ");
  });

  it("converts watch?v= links", () => {
    const url = "https://www.youtube.com/watch?v=LKa0ABbkGrQ";
    expect(normalizeYouTubeUrl(url)).toBe("https://www.youtube.com/embed/LKa0ABbkGrQ");
  });

  it("returns null if no url", () => {
    expect(normalizeYouTubeUrl(null)).toBeNull();
  });
});

describe("getResourcesManagement", () => {
  it("renders with data", async () => {
    const mockImages = [{ imageUrl: "test.jpg" }];
    const mockText = { title: "Resources", paragraphs: ["Hello"] };

    ResourcesImage.find.mockReturnValue({ sort: jest.fn().mockReturnValue(mockImages) });
    ResourcesText.findOne.mockResolvedValue(mockText);

    const req = { query: {} };
    const res = { render: jest.fn() };

    await getResourcesManagement(req, res);

    expect(res.render).toHaveBeenCalledWith("resourcesmanagement", {
      resources: mockImages,
      resourcesText: mockText,
      layout: false,
      error: undefined,
    });
  });
});

describe("updateResourcesText", () => {
  it("updates text and redirects", async () => {
    const mockSave = jest.fn();
    ResourcesText.findOne.mockResolvedValue({ save: mockSave });

    const req = { body: { title: "Resources", paragraphs: ["Test"], videoUrl: "https://youtu.be/LKa0ABbkGrQ" } };
    const res = { send: jest.fn(), status: jest.fn().mockReturnThis() };

    await updateResourcesText(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("/content-management"));
  });
});
