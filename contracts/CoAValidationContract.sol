// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Certificate of Analysis (CoA) Validation Contract
/// @notice Issues CoA only if a valid Permit to Circulate (NIE) exists

interface IPermitValidationContract {
    /// @notice Retrieves details of a permit
    /// @return permitId, cppobId, productName, industry, productType, approvalDate, expiryDate
    function getPermitDetails(uint256 _permitId)
        external
        view
        returns (
            uint256,       // permitId
            uint256,       // cppobId
            string memory, // productName
            string memory, // industry
            string memory, // productType
            uint256,       // approvalDate
            uint256        // expiryDate
        );
}

contract CoAValidationContract {
    // ── DATA STRUCTURES ─────────────────────────────────────────────────────────
    struct NutritionFact {
        string  nutrientName;
        string  unit;
        uint256 specMin;
        uint256 specMax;
        uint256 actualValue;
    }

    struct CoA {
        uint256         batchId;
        string          productName;
        string          industry;
        string          coaHash;      // IPFS hash of CoA document
        uint256         productionDate;
        uint256         expiryDate;
        uint256         permitId;     // linked NIE permit
        NutritionFact[] nutritionFacts;
    }

    // ── STATE ──────────────────────────────────────────────────────────────────
    address public industryAuthority;
    IPermitValidationContract public permitContract;
    mapping(uint256 => CoA) public coas;

    // ── EVENTS ─────────────────────────────────────────────────────────────────
    event CoAIssued(
        uint256 indexed batchId,
        uint256 indexed permitId,
        string  productName,
        string  industry,
        uint256 expiryDate
    );

    // ── MODIFIER ───────────────────────────────────────────────────────────────
    modifier onlyIndustry() {
        require(msg.sender == industryAuthority, "Only industry");
        _;
    }

    // ── CONSTRUCTOR ────────────────────────────────────────────────────────────
    /// @param _permitContractAddress address of the deployed PermitValidationContract
    constructor(address _permitContractAddress) {
        require(_permitContractAddress != address(0), "Invalid permit address");
        industryAuthority = msg.sender;
        permitContract    = IPermitValidationContract(_permitContractAddress);
    }

    // ── ISSUE CoA ──────────────────────────────────────────────────────────────
    /// @notice Issues a Certificate of Analysis for a product batch
    function issueCoA(
        uint256         _batchId,
        string memory   _productName,
        string memory   _industry,
        uint256         _productionDate,
        string memory   _coaHash,
        uint256         _permitId,
        string[] memory _nutrientNames,
        string[] memory _units,
        uint256[] memory _specMin,
        uint256[] memory _specMax,
        uint256[] memory _actualValues
    ) external onlyIndustry {
        require(coas[_batchId].batchId == 0, "CoA already exists");
        require(
            _nutrientNames.length == _units.length &&
            _units.length         == _specMin.length &&
            _specMin.length       == _specMax.length &&
            _specMax.length       == _actualValues.length,
            "Nutrition arrays mismatch"
        );

        _verifyPermit(_permitId);

        uint256 expiry = _productionDate + 5 * 365 days;
        CoA storage entry = coas[_batchId];

        entry.batchId        = _batchId;
        entry.productName    = _productName;
        entry.industry       = _industry;
        entry.coaHash        = _coaHash;
        entry.productionDate = _productionDate;
        entry.expiryDate     = expiry;
        entry.permitId       = _permitId;

        for (uint256 i = 0; i < _nutrientNames.length; i++) {
            entry.nutritionFacts.push(NutritionFact({
                nutrientName: _nutrientNames[i],
                unit:         _units[i],
                specMin:      _specMin[i],
                specMax:      _specMax[i],
                actualValue:  _actualValues[i]
            }));
        }

        emit CoAIssued(_batchId, _permitId, _productName, _industry, expiry);
    }

    // ── INTERNAL: VERIFY PERMIT ────────────────────────────────────────────────
    function _verifyPermit(uint256 _permitId) internal view {
        try permitContract.getPermitDetails(_permitId) 
            returns (
                uint256 permitId,
                uint256 /*cppobId*/,
                string memory /*productName*/,
                string memory /*industry*/,
                string memory /*productType*/,
                uint256 /*approvalDate*/,
                uint256 expiryDate
            ) 
        {
            require(permitId == _permitId,       "Permit ID mismatch");
            require(expiryDate > block.timestamp, "Permit expired");
        } catch {
            revert("Invalid or missing permit");
        }
    }

    // ── PUBLIC GETTERS ─────────────────────────────────────────────────────────
    /// @notice Retrieve CoA metadata and document link
    function getCoADetails(uint256 _batchId)
        external
        view
        returns (
            uint256, string memory, string memory, string memory,
            uint256, uint256, uint256, bool
        )
    {
        CoA storage c = coas[_batchId];
        require(c.batchId != 0, "CoA not found");
        return (
            c.batchId,
            c.productName,
            c.industry,
            string(abi.encodePacked("https://ipfs.io/ipfs/", c.coaHash)),
            c.productionDate,
            c.expiryDate,
            c.permitId,
            true
        );
    }

    /// @notice Retrieve the full list of nutrition facts for a batch
    function getNutrientFacts(uint256 _batchId)
        external
        view
        returns (NutritionFact[] memory)
    {
        CoA storage c = coas[_batchId];
        require(c.batchId != 0, "CoA not found");
        return c.nutritionFacts;
    }
}