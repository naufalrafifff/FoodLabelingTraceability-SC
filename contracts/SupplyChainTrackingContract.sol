// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Supply Chain Tracking Contract
/// @notice Tracks shipments only if a valid NIE (Permit to Circulate) and CoA exist

interface IPermitValidationContract {
    /// @notice Retrieves details of a Permit to Circulate (NIE)
    /// @return permitId, cppobId, productName, industry, productType, approvalDate, expiryDate
    function getPermitDetails(uint256 _permitId)
        external
        view
        returns (
            uint256,
            uint256,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256
        );
}

interface ICoAValidationContract {
    /// @notice Retrieves details of a Certificate of Analysis
    /// @return batchId, productName, industry, coaUrl, productionDate, expiryDate, permitId, isValid
    function getCoADetails(uint256 _batchId)
        external
        view
        returns (
            uint256,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            uint256,
            bool
        );
}

contract SupplyChainTrackingContract {
    struct Shipment {
        uint256 shipmentId;
        uint256 batchId;
        uint256 permitId;
        address industry;
        string distributor;
        string retailer;
        uint256 createdAt;
        uint256 receivedByDistributorAt;
        uint256 receivedByRetailerAt;
    }

    address public industryAuthority;
    IPermitValidationContract public permitContract;
    ICoAValidationContract    public coaContract;
    mapping(uint256 => Shipment) public shipments;

    event ShipmentCreated(
        uint256 indexed shipmentId,
        uint256 indexed batchId,
        uint256 indexed permitId,
        string distributor,
        string retailer
    );
    event ShipmentReceivedByDistributor(uint256 indexed shipmentId, uint256 timestamp);
    event ShipmentReceivedByRetailer  (uint256 indexed shipmentId, uint256 timestamp);

    modifier onlyIndustry() {
        require(msg.sender == industryAuthority, "Only industry");
        _;
    }

    /// @param _permitContract Address of deployed PermitValidationContract
    /// @param _coaContract    Address of deployed CoAValidationContract
    constructor(address _permitContract, address _coaContract) {
        require(_permitContract != address(0), "Invalid permit addr");
        require(_coaContract    != address(0), "Invalid CoA addr");
        industryAuthority = msg.sender;
        permitContract    = IPermitValidationContract(_permitContract);
        coaContract       = ICoAValidationContract(_coaContract);
    }

    /// @notice Create a shipment after verifying NIE and CoA
    function createShipment(
        uint256 _shipmentId,
        uint256 _batchId,
        uint256 _permitId,
        string memory _distributor,
        string memory _retailer
    ) external onlyIndustry {
        require(shipments[_shipmentId].shipmentId == 0, "Shipment exists");

        // 1) Verify permit (NIE)
        (
            uint256 permitId,
            ,
            ,
            ,
            ,
            ,
            uint256 permitExpiry
        ) = permitContract.getPermitDetails(_permitId);
        require(permitId == _permitId,      "Invalid permit");
        require(permitExpiry > block.timestamp, "Permit expired");

        // 2) Verify CoA
        (
            uint256 batch,
            ,
            ,
            ,
            ,
            ,
            ,
            bool isValid
        ) = coaContract.getCoADetails(_batchId);
        require(batch == _batchId,    "Batch mismatch");
        require(isValid,              "Invalid CoA");

        // 3) Record shipment
        shipments[_shipmentId] = Shipment({
            shipmentId:             _shipmentId,
            batchId:                _batchId,
            permitId:               _permitId,
            industry:               msg.sender,
            distributor:            _distributor,
            retailer:               _retailer,
            createdAt:              block.timestamp,
            receivedByDistributorAt: 0,
            receivedByRetailerAt:    0
        });

        emit ShipmentCreated(_shipmentId, _batchId, _permitId, _distributor, _retailer);
    }

    /// @notice Mark a shipment as received by distributor
    function receiveByDistributor(uint256 _shipmentId) external onlyIndustry {
        Shipment storage s = shipments[_shipmentId];
        require(s.shipmentId != 0,               "No such shipment");
        require(s.receivedByDistributorAt == 0,  "Already received");
        s.receivedByDistributorAt = block.timestamp;
        emit ShipmentReceivedByDistributor(_shipmentId, block.timestamp);
    }

    /// @notice Mark a shipment as received by retailer
    function receiveByRetailer(uint256 _shipmentId) external onlyIndustry {
        Shipment storage s = shipments[_shipmentId];
        require(s.shipmentId != 0,                  "No such shipment");
        require(s.receivedByDistributorAt != 0,     "Not received by distributor");
        require(s.receivedByRetailerAt == 0,        "Already received");
        s.receivedByRetailerAt = block.timestamp;
        emit ShipmentReceivedByRetailer(_shipmentId, block.timestamp);
    }

    /// @notice Retrieve full shipment details
    function getShipmentDetails(uint256 _shipmentId)
        external
        view
        returns (
            uint256, uint256, uint256, address,
            string memory, string memory,
            uint256, uint256, uint256
        )
    {
        Shipment storage s = shipments[_shipmentId];
        require(s.shipmentId != 0, "No such shipment");
        return (
            s.shipmentId,
            s.batchId,
            s.permitId,
            s.industry,
            s.distributor,
            s.retailer,
            s.createdAt,
            s.receivedByDistributorAt,
            s.receivedByRetailerAt
        );
    }
}