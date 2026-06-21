// contracts/CppobValidationContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title CPPOB (GMP) License Contract
contract CppobValidationContract {
    struct CppobLicense {
        uint256 cppobId;
        string  facilityName;
        string  facilityAddress;
        string  licenseHash;    // IPFS hash of GMP license
        uint256 issueDate;
        uint256 expiryDate;
    }

    address public bpomAuthority;
    mapping(uint256 => CppobLicense) public licenses;

    event CppobIssued(
        uint256 indexed cppobId,
        uint256 issueDate,
        uint256 expiryDate
    );

    modifier onlyBPOM() {
        require(msg.sender == bpomAuthority, "Only BPOM");
        _;
    }

    constructor() {
        bpomAuthority = msg.sender;
    }

    /// @notice Issue a new CPPOB license
    function issueCppob(
        uint256 _id,
        string memory _name,
        string memory _addr,
        string memory _hash,
        uint256 _date
    ) external onlyBPOM {
        require(licenses[_id].issueDate == 0, "Exists");
        require(_date <= block.timestamp, "Future date");

        uint256 exp = _date + 5 * 365 days;
        licenses[_id] = CppobLicense(_id, _name, _addr, _hash, _date, exp);
        emit CppobIssued(_id, _date, exp);
    }

    /// @notice Retrieve all CPPOB license fields
    function getCppobDetails(uint256 _id)
        external
        view
        returns (
            uint256, string memory, string memory,
            string memory, uint256, uint256
        )
    {
        CppobLicense storage lic = licenses[_id];
        require(lic.issueDate != 0, "Not found");
        return (
            lic.cppobId,
            lic.facilityName,
            lic.facilityAddress,
            lic.licenseHash,
            lic.issueDate,
            lic.expiryDate
        );
    }

    /// @notice Retrieve the IPFS link for the CPPOB license document
    function getCppobDocument(uint256 _id)
        external
        view
        returns (string memory)
    {
        CppobLicense storage lic = licenses[_id];
        require(lic.issueDate != 0, "Not found");
        return string(abi.encodePacked("https://ipfs.io/ipfs/", lic.licenseHash));
    }
}