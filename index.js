import "dotenv/config";
import fs from "fs";
import { Keypair } from "@solana/web3.js";
import { Flipside } from "@flipsidecrypto/sdk";

// Initialize `Flipside` with your API key
const flipside = new Flipside(
	process.env.API,
	"https://api-v2.flipsidecrypto.xyz"
);

function readFiles(dirname, onFileContent, onError) {
	fs.readdir(dirname, function (err, filenames) {
		if (err) {
			onError(err);
			return;
		}

		filenames.forEach(function (filename) {
			fs.readFile(dirname + filename, "utf-8", function (err, content) {
				if (err) {
					onError(err);
					return;
				}
				onFileContent(filename, content);
			});
		});
	});
}

function getFileExtension(filename) {
	return filename.split(".").pop();
}

function getWalletFromJson(content) {
	return Keypair.fromSecretKey(
		new Uint8Array(JSON.parse(content))
	).publicKey.toString();
}

function getWalletsFromTxt(content) {
	return content.split("\n");
}

function checkFileExtension(filename) {
	switch (getFileExtension(filename)) {
		case "json":
			return true;
		case "txt":
			return true;
		default:
			return false;
	}
}

async function getVolume(wallet) {
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

	return queryResultSet.records[0].total;
}

function writeToFile(stream, filename, address, volume) {
	stream.write(`${filename},${address},${volume}\n`, () => {
		console.log("File updated. Added: " + address);
	});
}

function main() {
	let stream = fs.createWriteStream("./output/output.csv");
	stream.write("Filename,Address,Jupiter Volume\n");

	readFiles(
		"./wallets/",
		async function (filename, content) {
			if (!checkFileExtension(filename)) {
				return;
			}

			if (getFileExtension(filename) === "json") {
				const wallet = getWalletFromJson(content);
				console.log(
					"Getting volume for file: " + filename + "\nPublic key: " + wallet
				);

				const jupiterVolume = await getVolume(wallet);

				writeToFile(stream, filename, wallet, jupiterVolume);
			}

			if (getFileExtension(filename) === "txt") {
				const wallets = getWalletsFromTxt(content);

				wallets.forEach(async (wallet) => {
					console.log(
						"Getting volume for file: " + filename + "\nPublic key: " + wallet
					);

					const jupiterVolume = await getVolume(wallet);

					writeToFile(stream, filename, wallet, jupiterVolume);
				});
			}
		},
		function (err) {
			throw err;
		}
	);
}

main();
