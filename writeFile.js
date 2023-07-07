import fs from "fs";

export const printResponse = (content) => {
  try {
    fs.writeFileSync("response.json", JSON.stringify(content), "utf-8");
    console.log("Response printed successfully....");
  } catch (err) {
    console.error(err);
  }
};
