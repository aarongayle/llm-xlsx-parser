# Test Suite for LLM XLSX Parser

This directory contains comprehensive tests for the LLM XLSX Parser package.

## Test Files

### `index.test.js`

The main test suite using Vitest that includes:

- **Gas Prices and Working Interest Validation**: Tests that the extracted gas prices and working interest values match expected values within acceptable tolerances
- **Error Handling**: Tests for missing API keys and invalid file paths
- **Data Structure Validation**: Ensures the output contains expected data patterns and structure
- **Numeric Value Extraction**: Validates that numeric values are parsed correctly

### `validate-specific-values.js`

A standalone validation script that specifically tests the gas prices and working interest values mentioned in the requirements. This script:

- Runs the analysis on the example XLSX file
- Extracts gas prices and working interest values
- Compares them against expected values with appropriate tolerances
- Provides detailed output showing which values pass/fail validation

## Running the Tests

### Prerequisites

1. Install dependencies: `pnpm install`
2. Set up your Gemini API key in a `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Running All Tests

```bash
pnpm test
```

### Running Tests Once (CI mode)

```bash
pnpm test:run
```

### Running Specific Value Validation

```bash
pnpm test:validate
```

## Expected Values

The tests validate against these expected values from the LOS.xlsx example:

### Gas Prices ($/KCF)

- 2022 Q1: 6.73
- 2022 Q2: 8.46
- 2022 Q3: 9.17
- 2022 Q4: 15.80
- 2023 Q1: 11.26
- 2023 Q2: 2.98
- 2023 Q3: 3.60
- 2023 Q4: 3.68
- 2024 Q1: 3.56
- 2024 Q2: 1.59
- 2024 Q3: 1.98
- 2024 Q4: 2.47
- 2025 Q1: 3.79

### Working Interest Values (NET TO WI)

- 2022 Q1: 1492932
- 2022 Q2: 1855968
- 2022 Q3: 1843238
- 2022 Q4: 2882928
- 2023 Q1: 1730478
- 2023 Q2: 453757
- 2023 Q3: 597380
- 2023 Q4: 647432
- 2024 Q1: 809220
- 2024 Q2: 393202
- 2024 Q3: 157421
- 2024 Q4: 377842
- 2025 Q1: 696481

## Tolerances

- **Gas Prices**: ±0.01 (1 cent tolerance)
- **Working Interest**: ±1 (1 dollar tolerance)

## Test Environment

The tests use:

- **Vitest** as the test runner
- **Node.js** environment
- **60-second timeout** for API calls
- Automatic cleanup of temporary test files

## Notes

- Tests will skip if `GEMINI_API_KEY` is not available
- The tests use the same configuration as the example script
- Temporary files are automatically cleaned up after tests complete
- All numeric values are validated with appropriate tolerances to account for minor variations in LLM output
