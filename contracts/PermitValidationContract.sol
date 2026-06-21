// contracts/PermitValidationContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICppob {
    function licenses(uint256) external view returns (
        uint256, string memory, string memory, string memory, uint256, uint256
    );
}

contract PermitValidationContract {
    struct Permit {
        uint256 permitId;
        uint256 cppobId;
        string  productName;
        string  industry;
        string  productType;
        string  permitHash;     // IPFS hash of permit
        uint256 approvalDate;
        uint256 expiryDate;
    }

    address public bpomAuthority;
    ICppob  public cppob;
    mapping(uint256 => Permit) public permits;

    event PermitIssued(uint256 indexed permitId, uint256 indexed cppobId, uint256 expiryDate);

    modifier onlyBPOM() {
        require(msg.sender == bpomAuthority, "Only BPOM");
        _;
    }

    constructor(address _cppobAddr) {
        require(_cppobAddr != address(0), "Invalid CPPOB addr");
        bpomAuthority = msg.sender;
        cppob = ICppob(_cppobAddr);
    }

    /// @notice Issue a new Permit to Circulate (NIE)
    function issuePermit(
        uint256 _id,
        uint256 _cppobId,
        string memory _prod,
        string memory _ind,
        string memory _type,
        string memory _hash,
        uint256 _date
    ) external onlyBPOM {
        require(permits[_id].approvalDate == 0, "Exists");
        (, , , , uint256 issue, uint256 expCppob) = cppob.licenses(_cppobId);
        require(issue != 0 && expCppob > block.timestamp, "CPPOB invalid");
        require(_date >= issue && _date <= block.timestamp, "Date invalid");

        uint256 exp = _date + 5 * 365 days;
        permits[_id] = Permit(_id, _cppobId, _prod, _ind, _type, _hash, _date, exp);
        emit PermitIssued(_id, _cppobId, exp);
    }

    /// @notice Retrieve full permit details
    function getPermitDetails(uint256 _id)
        external
        view
        returns (
            uint256 permitId,
            uint256 cppobId,
            string memory productName,
            string memory industry,
            string memory productType,
            uint256 approvalDate,
            uint256 expiryDate
        )
    {
        Permit storage p = permits[_id];
        require(p.approvalDate != 0, "Not found");
        return (
            p.permitId,
            p.cppobId,
            p.productName,
            p.industry,
            p.productType,
            p.approvalDate,
            p.expiryDate
        );
    }

    /// @notice Retrieve IPFS link for the permit document
    function getPermitDocument(uint256 _id) external view returns (string memory) {
        Permit storage p = permits[_id];
        require(p.approvalDate != 0, "Not found");
        return string(abi.encodePacked("https://ipfs.io/ipfs/", p.permitHash));
    }
}