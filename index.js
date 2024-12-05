import "dotenv/config";
import fs from "fs";
import { Flipside } from "@flipsidecrypto/sdk";

// Initialize `Flipside` with your API key
const flipside = new Flipside(
	process.env.API,
	"https://api-v2.flipsidecrypto.xyz"
);

var fileData = fs.readFileSync("addresses.txt", "utf-8");
var wallets = fileData.split("\n");

let result = [];

wallets.forEach(async (wallet) => {
	const sql = `
    WITH swap_data AS (
      SELECT
        swapper,
        SUM(SWAP_FROM_AMOUNT_USD) as total
      FROM
        solana.defi.ez_dex_swaps
      WHERE
        swap_program like 'jupiter%'
        AND swapper = '${wallet}'
      GROUP BY
        swapper
    )
    SELECT
      '${wallet}' as swapper,
      COALESCE(total, 0) as total
    FROM
      swap_data
      RIGHT JOIN (
        SELECT
          '${wallet}' as swapper
      ) as addr ON swap_data.swapper = addr.swapper;
    `;

	// Send the `Query` to Flipside's query engine and await the results
	const queryResultSet = await flipside.query.run({ sql: sql });

	result["address"] = queryResultSet.records[0].swapper;
	result["total"] = queryResultSet.records[0].total;

	console.log(result);
});
