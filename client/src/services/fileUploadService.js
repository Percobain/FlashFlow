import { toast } from 'sonner';

class FileUploadService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  // Complete file upload with full metadata tracking
  async uploadFileComplete(file, assetPath, uploadedBy, metadata = {}) {
    try {
      console.log('📤 Starting complete file upload:', file.name);
      
      // Validate file first
      this.validateFile(file);
      
      // Extract asset type from path or metadata
      const assetType = metadata.assetType || this.extractAssetTypeFromPath(assetPath) || 'invoice';
      
      // Read and parse file content if it's JSON
      let fileData = null;
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        fileData = await this.parseJsonFile(file);
        
        // Extract structured data based on asset type
        const extractedData = this.extractAssetData(fileData, assetType);
        metadata.extractedData = extractedData;
      }

      // Upload file to storage
      const uploadResult = await this.uploadFile(file, assetType, uploadedBy);
      
      // Return complete result with all metadata
      return {
        ...uploadResult,
        fileData,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          assetPath,
          fileSize: file.size,
          fileType: file.type
        }
      };
    } catch (error) {
      console.error('❌ Complete upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    }
  }

  // Extract asset type from file path
  extractAssetTypeFromPath(path) {
    const pathLower = path.toLowerCase();
    if (pathLower.includes('invoice')) return 'invoice';
    if (pathLower.includes('saas')) return 'saas';
    if (pathLower.includes('creator')) return 'creator';
    if (pathLower.includes('rental')) return 'rental';
    if (pathLower.includes('luxury')) return 'luxury';
    return 'invoice'; // default
  }

  // Direct upload to backend (which handles R2)
  async uploadFile(file, assetType = 'invoice', uploadedBy = null) {
    try {
      console.log('📤 Starting file upload:', file.name);

      // Read file content
      const fileContent = await this.readFileContent(file);

      const uploadData = {
        fileName: file.name,
        fileContent: fileContent,
        fileType: file.type || 'application/json',
        assetType,
        uploadedBy
      };

      console.log('📤 Uploading to backend:', uploadData.fileName);

      const response = await fetch(`${this.baseURL}/api/storage/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Upload successful:', result);
      toast.success('File uploaded successfully!');
      
      return {
        success: true,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        originalName: result.originalName,
        fileId: result.fileId,
        hash: result.hash,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    }
  }

  // Read file content as string (for JSON files)
  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          
          // If it's a JSON file, validate it
          if (file.type === 'application/json' || file.name.endsWith('.json')) {
            JSON.parse(content); // Validate JSON
          }
          
          resolve(content);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Parse JSON file and return parsed data
  async parseJsonFile(file) {
    try {
      const content = await this.readFileContent(file);
      const parsed = JSON.parse(content);
      
      console.log('✅ JSON file parsed successfully:', file.name);
      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse JSON file:', error);
      throw new Error(`Failed to parse JSON file: ${error.message}`);
    }
  }

  // Extract specific data from JSON based on asset type
  extractAssetData(jsonData, assetType) {
    try {
      switch (assetType) {
        case 'invoice':
          return this.extractInvoiceData(jsonData);
        case 'saas':
          return this.extractSaasData(jsonData);
        case 'creator':
          return this.extractCreatorData(jsonData);
        case 'rental':
          return this.extractRentalData(jsonData);
        case 'luxury':
          return this.extractLuxuryData(jsonData);
        default:
          return jsonData;
      }
    } catch (error) {
      console.error('❌ Failed to extract asset data:', error);
      return jsonData;
    }
  }

  // Extract invoice data
  extractInvoiceData(data) {
    return {
      invoiceNumber: data.invoice_number || data.invoiceNumber || 'N/A',
      amount: data.amount || data.total_amount || data.totalAmount || 0,
      currency: data.currency || 'USD',
      dueDate: data.due_date || data.dueDate || null,
      issueDate: data.issue_date || data.issueDate || data.date || null,
      clientName: data.client_name || data.clientName || data.customer || 'Unknown',
      clientEmail: data.client_email || data.clientEmail || null,
      status: data.status || 'pending',
      description: data.description || data.items?.[0]?.description || 'Invoice',
      paymentTerms: data.payment_terms || data.paymentTerms || null,
      items: data.items || [],
      metadata: {
        originalData: data,
        extractedAt: new Date().toISOString()
      }
    };
  }

  // Extract SaaS data
  extractSaasData(data) {
    return {
      subscriptionId: data.subscription_id || data.subscriptionId || 'N/A',
      planName: data.plan_name || data.planName || data.plan || 'Unknown',
      monthlyRevenue: data.monthly_revenue || data.monthlyRevenue || data.mrr || 0,
      currency: data.currency || 'USD',
      subscriberCount: data.subscriber_count || data.subscriberCount || data.users || 0,
      churnRate: data.churn_rate || data.churnRate || 0,
      ltv: data.ltv || data.lifetime_value || data.lifetimeValue || 0,
      renewalDate: data.renewal_date || data.renewalDate || null,
      status: data.status || 'active',
      metadata: {
        originalData: data,
        extractedAt: new Date().toISOString()
      }
    };
  }

  // Extract creator data
  extractCreatorData(data) {
    return {
      channelName: data.channel_name || data.channelName || 'Unknown',
      platform: data.platform || 'Unknown',
      subscribers: data.subscribers || data.follower_count || data.followers || 0,
      monthlyViews: data.monthly_views || data.monthlyViews || data.views || 0,
      monthlyRevenue: data.monthly_revenue || data.monthlyRevenue || data.revenue || 0,
      currency: data.currency || 'USD',
      engagementRate: data.engagement_rate || data.engagementRate || 0,
      niche: data.niche || data.category || 'General',
      metadata: {
        originalData: data,
        extractedAt: new Date().toISOString()
      }
    };
  }

  // Extract rental data
  extractRentalData(data) {
    return {
      propertyId: data.property_id || data.propertyId || 'N/A',
      address: data.address || data.location || 'Unknown',
      monthlyRent: data.monthly_rent || data.monthlyRent || data.rent || 0,
      currency: data.currency || 'USD',
      occupancyRate: data.occupancy_rate || data.occupancyRate || 100,
      propertyType: data.property_type || data.propertyType || data.type || 'Residential',
      bedrooms: data.bedrooms || data.beds || null,
      bathrooms: data.bathrooms || data.baths || null,
      squareFeet: data.square_feet || data.squareFeet || data.size || null,
      leaseStart: data.lease_start || data.leaseStart || null,
      leaseEnd: data.lease_end || data.leaseEnd || null,
      metadata: {
        originalData: data,
        extractedAt: new Date().toISOString()
      }
    };
  }

  // Extract luxury data
  extractLuxuryData(data) {
    return {
      itemName: data.item_name || data.itemName || data.name || 'Unknown',
      brand: data.brand || 'Unknown',
      category: data.category || data.type || 'Luxury Item',
      purchasePrice: data.purchase_price || data.purchasePrice || data.price || 0,
      currentValue: data.current_value || data.currentValue || data.value || 0,
      currency: data.currency || 'USD',
      condition: data.condition || 'Good',
      serialNumber: data.serial_number || data.serialNumber || null,
      purchaseDate: data.purchase_date || data.purchaseDate || null,
      authenticityProof: data.authenticity_proof || data.authenticityProof || null,
      metadata: {
        originalData: data,
        extractedAt: new Date().toISOString()
      }
    };
  }

  // Batch upload multiple files
  async uploadMultipleFiles(files, assetType = 'invoice', uploadedBy = null, metadata = {}) {
    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.name}`);
        
        try {
          const result = await this.uploadFileComplete(
            file, 
            `assets/${assetType}`, 
            uploadedBy, 
            { ...metadata, batchIndex: i }
          );
          results.push(result);
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
          results.push({ error: error.message, fileName: file.name });
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Batch upload failed:', error);
      throw error;
    }
  }

  // Alternative: Upload via presigned URL (if needed)
  async uploadViaPresignedUrl(file, assetType = 'invoice', uploadedBy = null) {
    try {
      console.log('📤 Getting presigned URL for:', file.name);

      // Get presigned URL
      const presignedResponse = await fetch(`${this.baseURL}/api/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/json',
          assetType,
          uploadedBy
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl, fileName } = await presignedResponse.json();

      console.log('📤 Uploading to R2:', uploadUrl);

      // Upload file to R2 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/json',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload to R2 failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      console.log('✅ File uploaded to R2');

      // Confirm upload with backend
      const confirmResponse = await fetch(`${this.baseURL}/api/storage/confirm-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileUrl,
          originalName: file.name,
          size: file.size,
          type: file.type || 'application/json',
          uploadedBy,
          assetType,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json();
        throw new Error(errorData.error || 'Failed to confirm upload');
      }

      const confirmResult = await confirmResponse.json();
      
      console.log('✅ Upload confirmed:', confirmResult);
      toast.success('File uploaded successfully!');
      
      return {
        success: true,
        fileUrl,
        fileName,
        originalName: file.name,
        fileId: confirmResult.fileRecord.id,
        hash: confirmResult.fileRecord.hash
      };
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    }
  }

  // Get user files
  async getUserFiles(address, assetType = null) {
    try {
      let url = `${this.baseURL}/api/storage/user/${address}/files`;
      if (assetType) {
        url += `?assetType=${assetType}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get user files:', error);
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(fileName) {
    try {
      const response = await fetch(`${this.baseURL}/api/storage/file/${fileName}`);
      
      if (!response.ok) {
        throw new Error(`File not found: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get file metadata:', error);
      throw error;
    }
  }

  // Validate file before upload
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/json',
      'text/plain',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'text/csv'
    ];

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.json')) {
      throw new Error('Invalid file type. Please upload JSON, PDF, image, or CSV files.');
    }

    return true;
  }

  // Create sample JSON data for different asset types
  createSampleData(assetType) {
    const samples = {
      invoice: {
        invoice_number: "INV-2024-001",
        amount: 5000,
        currency: "USD",
        due_date: "2024-12-31",
        issue_date: "2024-11-15",
        client_name: "Tech Corp LLC",
        client_email: "billing@techcorp.com",
        status: "pending",
        description: "Web development services",
        payment_terms: "Net 30",
        items: [
          {
            description: "Web development",
            quantity: 1,
            rate: 5000,
            amount: 5000
          }
        ]
      },
      saas: {
        subscription_id: "SUB-2024-001",
        plan_name: "Enterprise",
        monthly_revenue: 15000,
        currency: "USD",
        subscriber_count: 150,
        churn_rate: 2.5,
        ltv: 50000,
        renewal_date: "2024-12-31",
        status: "active"
      },
      creator: {
        channel_name: "Tech Reviews Pro",
        platform: "YouTube",
        subscribers: 100000,
        monthly_views: 2000000,
        monthly_revenue: 8000,
        currency: "USD",
        engagement_rate: 5.2,
        niche: "Technology"
      },
      rental: {
        property_id: "PROP-2024-001",
        address: "123 Main St, Tech City, TC 12345",
        monthly_rent: 3500,
        currency: "USD",
        occupancy_rate: 95,
        property_type: "Apartment",
        bedrooms: 2,
        bathrooms: 2,
        square_feet: 1200,
        lease_start: "2024-01-01",
        lease_end: "2024-12-31"
      },
      luxury: {
        item_name: "Vintage Rolex Submariner",
        brand: "Rolex",
        category: "Watch",
        purchase_price: 15000,
        current_value: 25000,
        currency: "USD",
        condition: "Excellent",
        serial_number: "123456789",
        purchase_date: "2020-06-15",
        authenticity_proof: "Certificate included"
      }
    };

    return samples[assetType] || samples.invoice;
  }
}

export default new FileUploadService();