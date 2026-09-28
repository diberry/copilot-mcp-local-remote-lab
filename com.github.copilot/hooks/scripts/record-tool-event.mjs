const phase = process.argv[2] === "finish" ? "finish" : "start";
process.stderr.write(
  `${JSON.stringify({ phase, timestamp: new Date().toISOString(), outcome: "observed" })}\n`,
);
